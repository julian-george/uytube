let backendUrl = window.location.protocol + "//" + window.location.hostname;
// when deploying locally, use this instead for backendUrl: (change 3000 to whatever port is in your env)
// let backendUrl =
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
  renderSections();
  renderSVG(state.hierarchy, generateColorList());
  player.cueVideoById(data.youtubeId);
}
// Uploads the data
function uploadData() {
  // We don't need to store hierarchy in the DB since it will be generated from state.sections
  const { hierarchy, ...prunedState } = state;
  // The .replace fixes a strange error with JSON.stringify having a colon at the end
  //  remove in future - this may be something to do with encoding or the nested object we're sending
  const data = JSON.stringify(prunedState);
  if (initialData && data == JSON.stringify(initialData)) {
    alert("Error: No Changes Made");
  } else if (data) {
    console.log(data);
    $.ajax({
      url: url,
      type: "POST",
      data: data,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function () {
        result = JSON.parse(result);
        if (!result.status) {
          console.log(result);
          alert("Error: " + result.message);
        } else if (result.status) {
          setSaved();
          openId(result.message.id);
        }
      },
    });
  }
}

const downloadData = () => {
  const dataStr =
    "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
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
