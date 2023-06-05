let backendUrl = window.location.protocol + "//" + window.location.hostname;
// when deploying locally, use this instead for backendUrl: (change 3000 to whatever port is in your env)
// backendUrl =
//   window.location.protocol + "//" + window.location.hostname + ":3000";
let videoId;
let initialData;

// Redirects page to new url with desired ID
function openId(id = document.getElementById("idInput").value) {
  let newUrl = window.location.origin + "/?id=" + id;
  window.location.href = newUrl;
}

// Fetches data from the backend based on desired ID
function fetchData(id) {
  $.get(backendUrl + "/get", { id: id }, function (result) {
    result = JSON.parse(result);
    if (result.status) {
      loadData(result.message.data.data);
    } else if (!result.status) alert("Error: " + result.message);
  });
}

// Converts data from old format into new format
function convertData(data) {
  const newData = {};
  newData.youtubeId = data.videoId;
  newData.sections = [];
  for (let i = 0; i < data.content.length; i++) {
    const currSection = data.content[i];
    newData.sections.push({
      title: currSection[1].section,
      time: currSection[0],
      level: 0,
    });
    for (let j = 0; j < currSection[1].content.length; j++) {
      const currDivision = currSection[1].content[j];
      const divisionTitle = currDivision[1].division;
      if (divisionTitle != "") {
        newData.sections.push({
          title: divisionTitle,
          time: currDivision[0],
          level: 1,
        });
      }
    }
  }
  return newData;
}

// Fully loads the data into the UI
function loadData(data) {
  // If this data is in the old format
  if (Object.keys(data).includes("Youtube title")) {
    data = convertData(data);
  }
  setState(data);
  renderSections(generateColorList());
  renderSVG(state.hierarchy, generateColorList());
  player.cueVideoById(data.youtubeId);
}
// Uploads the data
function uploadData() {
  // We don't need to store hierarchy in the DB since it will be generated from state.sections
  const { hierarchy, ...prunedState } = state;
  const data = JSON.stringify(prunedState);
  if (initialData && data == JSON.stringify(initialData)) {
    alert("Error: No Changes Made");
  } else if (data) {
    $.ajax({
      url: backendUrl + "/add",
      type: "POST",
      data: data,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function (result) {
        if (!result.status) {
          alert("Error: " + result.message);
        } else if (result.status) {
          setSaved();
          openId(result.message.id);
        }
      },
      error: function (err) {
        alert("Error: " + err);
      },
    });
  }
}

const downloadData = () => {
  const { hierarchy, ...prunedState } = state;
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(prunedState, null, 2));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", state.youtubeId + ".uytube.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

const importData = () => {
  const files = document.getElementById("selectFiles").files;
  if (files.length <= 0) return;

  const fr = new FileReader();

  fr.onload = function (e) {
    const result = JSON.parse(e.target.result);
    loadData(result);
  };

  fr.readAsText(files.item(0));
  setUnsaved();
};
