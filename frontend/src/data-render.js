var fs = 10; // fractions of a second

// Keeps track of whether the user has made any edits
let formDirty = false;

// Whether or not the page is currently in theatre mode
let theatreActive = false;

function importJson() {
  // loads existing data into table if no file selected
  // https://stackoverflow.com/questions/36127648/uploading-a-json-file-and-using-it
  // adapted
  var files = document.getElementById("selectFiles").files;
  if (files.length <= 0) {
    loadTable();
    return false;
  }

  var fr = new FileReader();

  fr.onload = function (e) {
    var result = JSON.parse(e.target.result);
    replaceData(result);
    loadTable();
    player.cueVideoById(result["videoId"]);

    renderSVG(result);
  };

  fr.readAsText(files.item(0));
}

// https://stackoverflow.com/a/46325093
function deleteRow(r) {
  var i = r.parentNode.parentNode.rowIndex;
  document.getElementById("table").deleteRow(i);
  setUnsaved();
}

function cueVideo(r) {
  entry = r.parentNode.parentNode.firstChild;
  stamp = Math.round(fs * Number(entry.innerHTML)) / fs;
  player.playVideo();
  player.seekTo(stamp);
}

function pushStamp(r, num = 0) {
  if (isNaN(num)) {
    return;
  }
  entry = r.parentNode.parentNode.firstChild;
  setUnsaved();
  return (entry.innerHTML =
    Math.round(fs * (Number(entry.innerHTML) + Number(num))) / fs);
}

function redescribe(r) {
  entry = r.parentNode.parentNode.lastChild;
  let user_input = prompt("Describe", entry.innerHTML);
  setUnsaved();
  return user_input == null ? null : (entry.innerHTML = user_input);
}

function loadTable() {
  let row_count = document.getElementById("table").rows.length;
  for (i = row_count - 1; i > 0; i--) {
    document.getElementById("table").deleteRow(i);
  }

  let nt = nestedData["content"].map((sec) =>
    sec[1]["content"].map((div) => div[0])
  );
  let nt_flat = nt.flat();
  let scroll = [];
  for (n = 0; n < nt.length; n++) {
    for (i = 0; i < nt[n].length; i++) {
      let cnode = nestedData["content"][n][1];
      scroll.push(
        (i == 0 ? cnode["section"] + " " : "") +
          (cnode["content"][i][1]["division"] == "" ? "" : "> ") +
          cnode["content"][i][1]["division"]
      );
    }
  }
  if (scroll.length != nt_flat.length) {
    return;
  }
  for (i = 0; i < scroll.length; i++) {
    addEntry(null, nt_flat[i], scroll[i]);
  }
}

// Change video
function newYoutubeSelection() {
  let newVideoId = prompt("Enter new Youtube ID", "");
  player.cueVideoById(newVideoId);
  setUnsaved();
}

function handleEntryInput(scope) {
  addEntry(scope);
  setUnsaved();
}

// Create table
function addEntry(scope = null, time = null, desc = null) {
  // TODO: sort table

  let stamp =
    time != null ? time : Math.round(fs * player.getCurrentTime()) / fs;

  var row = document.createElement("TR");
  var cellTime = document.createElement("TD");
  var cellCtrl = document.createElement("TD");
  var cellDesc = document.createElement("TD");
  cellDesc.className = "clickable";

  user_txt = desc != null ? desc : prompt("Describe", "");
  if (!user_txt) {
    user_txt = "";
  }
  var timenode = document.createTextNode(stamp.toString());
  if (scope == "small") {
    var descnode = document.createTextNode("> " + user_txt);
  } else {
    var descnode = document.createTextNode("" + user_txt);
  }

  cellTime.appendChild(timenode);
  row.appendChild(cellTime);

  cellCtrl.innerHTML =
    "" +
    '<button onclick="deleteRow(this)">Delete</button>' +
    '<button onclick="cueVideo(this)">Cue video</button>' +
    '<button onclick="pushStamp(this,' +
    -1 / fs +
    ')">-</button>' +
    '<button onclick="pushStamp(this,' +
    1 / fs +
    ')">+</button>' +
    '<button onclick="redescribe(this)">Redescribe</button>';
  row.appendChild(cellCtrl);

  cellDesc.appendChild(descnode);
  row.appendChild(cellDesc);

  document.getElementById("table").appendChild(row);
}

// Compile data
function compileDataAndRender(download = false, upload = false) {
  // Get user entries
  items = document.getElementById("table").rows;

  if (items.length <= 1) {
    alert("You must add a section before saving.");
    return false;
  }

  let ta = [];
  for (i = 1; i < items.length; i++) {
    stamp = Number(
      items[i].cells[0].innerText || items[i].cells[0].textContent
    );
    description = items[i].cells[2].innerText || items[i].cells[2].textContent;
    ta.push([stamp, description]);
  }
  ta = ta.sort(function (a, b) {
    return a[0] - b[0];
  });

  // Parse data
  let newData = [];
  for (i = 0; i < ta.length; i++) {
    ds = ta[i][1].split(/ *> */);
    if (ds.length == 1) {
      // new large section
      newData.push([
        ta[i][0],
        { section: ds[0], content: [[ta[i][0], { division: "" }]] },
      ]);
    } else if (ds.length == 2) {
      if (ds[0] != "") {
        // new large, small sections
        newData.push([
          ta[i][0],
          { section: ds[0], content: [[ta[i][0], { division: ds[1] }]] },
        ]);
      } else if (ds[0] == "" && newData.length == 0) {
        // new small section; no large section to contain it yet
        newData.push([
          ta[i][0],
          { section: "", content: [[ta[i][0], { division: ds[1] }]] },
        ]);
      } else {
        // new small section; will be nested under existing large section
        newData[newData.length - 1][1]["content"].push([
          ta[i][0],
          { division: ds[1] },
        ]);
      }
    }
  }

  // Provide data
  let videoId = player.getVideoData()["video_id"];
  let title = player.getVideoData()["title"];

  // let json_pretty = '{\n  "videoId": "'
  //   + videoId + '",\n  "Youtube title": "'
  //   + title + '",\n  "content":'
  //   + JSON.stringify(newData)
  //   .replace(/(\[[0-9.]+,{"division")/g, '\n        $1')
  //   .replace(/(\[[0-9.]+,{"section")/g, '\n    $1')
  //   .replace(/(]}])/g, '\n      $1')
  //   .replace(/(}])(])/g, '$1\n  $2')
  //   + '\n}'
  let returnObject = {
    videoId: videoId,
    "Youtube title": title,
    content: newData,
  };
  let json_pretty = JSON.stringify(returnObject);
  if (download) {
    downloadObjectAsJson(json_pretty, videoId);
  } else if (upload) {
    return json_pretty;
  }

  renderSVG({
    videoId: videoId,
    "Youtube title": title,
    content: newData,
  });

  replaceData({
    videoId: videoId,
    "Youtube title": title,
    content: newData,
  });
  loadTable();
}

// Before the page is unloaded (exited), returns a warning messages that will pop up for the user
// On most browsers, our custom string won't be in the popup
function unloadHandler(event) {
  const warningString =
    "Are you sure you want to exit? Your annotations may not have been saved.";
  event.returnValue = warningString;
  return warningString;
}

// Called whenever the current form state is edited and becomes unsaved
function setUnsaved() {
  if (!formDirty) {
    $("#save-button").prop("disabled", false);
    // Listens for the user exiting and returns a warning message to pop up before they do so
    window.addEventListener("beforeunload", unloadHandler);
    formDirty = true;
  }
}

// Called whenever the current form state has been saved
function setSaved() {
  if (formDirty) {
    $("#save-button").prop("disabled", true);
    window.removeEventListener("beforeunload", unloadHandler);
    formDirty = false;
  }
}

const theatreOffButton = "Enter theatre mode";
const theatreOnButton = "Exit theatre mode";

// Handles resizing of video player & hiding of buttons when entering/exiting theatre mode
function theatreHandler() {
  const newSize = theatreActive ? smallPlayerSize : largePlayerSize;
  $(player.h).css({
    height: newSize.height,
    width: newSize.width,
  });
  if (theatreActive) {
    $("#form-column").show();
    $("#theatre-button").text(theatreOffButton);
    theatreActive = false;
  } else {
    $("#form-column").hide();
    $("#theatre-button").text(theatreOnButton);
    theatreActive = true;
  }
}
