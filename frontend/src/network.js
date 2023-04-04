let backendUrl = window.location.protocol + "//" + window.location.hostname;
// when deploying locally, use this instead for backendUrl: (change 3000 to whatever port is in your env)
// let backendUrl =
// window.location.protocol + "//" + window.location.hostname + ":3000";
let videoId;
let initialData;

function onPlayerReady() {
  // when the page & player loads, fetch the id from the URL
  const urlId = new URLSearchParams(window.location.search).get("id");
  if (urlId != null) {
    $("#idInput").attr("value", urlId);
    fetchData(urlId);
  }
}

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

// Fully loads the data into the UI
function loadData(data) {
  initialData = data;
  replaceData(data);
  loadTable();
  renderSVG(data);
  renderSections();
  player.cueVideoById(data.videoId);
}

// Uploads the data
function uploadData() {
  let data = compileDataAndRender(false, true);
  if (initialData && data == JSON.stringify(initialData)) {
    alert("Error: No Changes Made");
  } else if (data) {
    $.post(backendUrl + "/add", data, function (result) {
      result = JSON.parse(result);
      if (!result.status) alert("Error: " + result.message);
      else if (result.status) {
        setSaved();
        openId(result.message.id);
      }
    });
  }
}
