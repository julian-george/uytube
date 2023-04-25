var fs = 10; // fractions of a second

// Keeps track of whether the user has made any edits
let formDirty = false;

// Whether or not the page is currently in theater mode
let theaterActive = false;

// Whether or not the page is currently in listening mode
let listenActive = false;

$(window).on("load", () => {
  const urlParams = new URLSearchParams(window.location.search);
  // If there is a theater variable in the URL, call theaterHandler to resize player on load
  if (urlParams.get("theater") != null) theaterHandler();
  else if (urlParams.get("listen") != null) listenHandler();
});

function importJson() {
  // loads existing data into table if no file selected
  // https://stackoverflow.com/questions/36127648/uploading-a-json-file-and-using-it
  // adapted
  var files = document.getElementById("selectFiles").files;
  if (files.length <= 0) {
    return false;
  }

  var fr = new FileReader();

  fr.onload = function (e) {
    var result = JSON.parse(e.target.result);
    setUnsaved();
    player.cueVideoById(result["videoId"]);

    // renderSVG(result);
  };

  fr.readAsText(files.item(0));
}

function cueVideo(stamp) {
  player.playVideo();
  player.seekTo(stamp);
}

// const levelPrefixes = {
//   0: "",
//   1: ">",
//   2: ">>",
// };

function redescribe(sectionIdx) {
  const currSection = Object.assign({}, state.sections[sectionIdx]);
  const timestamp = currSection.time;
  const level = currSection.level;

  let sectionTitle = prompt(
    "Describe",
    "> ".repeat(currSection.level) + currSection.title
  )?.trim();
  if (!sectionTitle) return; // previously forebade a blank title
  const split_input = sectionTitle.split(">").map(title => title.trim());

  // apply a new title to the timestamp at the existing hierarchical level
  retitleSection(split_input[level] == undefined ? "[delete me]" : split_input[level], sectionIdx);

  // remove the entry at the existing hierarchical level if it gets erased while another level is written
  if (split_input[level] == "" && split_input.findIndex(title => title?.length >= 1) != -1) {
    deleteSection(sectionIdx);
  }

  // apply edits at the other hierarchical levels
  for (let m of [2, 1, 0]) {
    if (m == level) continue;
    const title = split_input[m] || false;
    if (title && title != "") {
      const extantSectionIdx = state.sections.findIndex(section => section.time == timestamp && section.level == m);
      if (extantSectionIdx != -1) {
        retitleSection(title, extantSectionIdx);
      } else {
        addSection(title, timestamp, m);
      }
    }
  }
}

function newYoutubeSelection() {
  const idInput = prompt("Enter new Youtube ID", state?.youtubeId || "");
  if (!idInput || idInput == "") return;
  // makes assumptions about Youtube videoID which may not remain true
  // https://webapps.stackexchange.com/a/101153
  if (/^[0-9A-Za-z_-]{10}[048AEIMQUYcgkosw]$/.test(idInput.trim())) {
    setYoutubeId(idInput.trim());
    return;
  }
  const regexMatches = idInput.match(/[0-9A-Za-z_-]{10}[048AEIMQUYcgkosw]/g);
  if (regexMatches.length == 1) {
    setYoutubeId(regexMatches[0]);
    return;
  }
  const parsedId = new URLSearchParams(idInput.split("?")?.[1] || idInput).get(
    "v"
  );
  setYoutubeId(parsedId);
}

function redescribeCurrent() {
  // compare timeToSectionIdx ?
  if (!player?.getCurrentTime || !player.getCurrentTime()) return;
  const timestamp = Math.floor(player.getCurrentTime() * 10) / 10;
  const currentIdx = state.sections.length - 1
    - state.sections.toReversed().findIndex(section => (section.time < timestamp))
    || -1;
  if (currentIdx != -1) {
    redescribe(currentIdx);
  }
}

function handleEntryInput(level) {
  if (!player?.getCurrentTime || !player.getCurrentTime()) return;
  const timestamp = Math.floor(player.getCurrentTime() * 10) / 10;
  const sectionTitle = prompt("Input section name");
  if (sectionTitle == null) return;
  const split_input = sectionTitle.split(">").map(title => title.trim());
  let idx = 0;
  for (let m = level; m <= 2; m++) {
    addSection(
      split_input[idx],
      timestamp,
      m
    );
    idx += 1;
    if (idx >= split_input.length) return;
  }
}

function displayTime(time) {
  // floating point errors not an issue since
  // time is received accurate to one decimal place
  const hrs = Math.floor(time / 3600);
  const mins = Math.floor((time % 3600) / 60);
  const secs = Math.round((time % 60) * 10) / 10;

  let ret = "";
  if (hrs > 0) {
    ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
  }
  if (mins > 0) {
    ret += "" + mins;
  }
  ret += ":" + (secs < 10 ? "0" : "") + secs;

  return ret;
}

function renderPanel() {
  $("#table>tbody>.panel-row").remove();
  for (let sectionIdx = 0; sectionIdx < state.sections.length; sectionIdx++) {
    const section = state.sections[sectionIdx];
    if (section?.invisible) continue;
    const { time, level, title, color } = section;
    if (level == 0 && !color) {
      recolorSection(
        defaultMacroColors[sectionIdx % defaultMacroColors.length],
        sectionIdx
      );
      // After recoloring, return early to prevent duplicate render
      return;
    }
    const stamp = time;

    const row = document.createElement("TR");
    row.className = "panel-row";
    const cellTime = document.createElement("TD");
    const cellEdit = document.createElement("TD");
    const cellDesc = document.createElement("TD");
    const cellColor = document.createElement("TD");
    cellDesc.className = "cell-description clickable";

    const descNode = document.createTextNode(
      "> ".repeat(level) + title
    );

    const timeNode = document.createTextNode(displayTime(stamp).toString());
    cellTime.appendChild(timeNode);
    row.appendChild(cellTime);

    // TO DO: use ctrl+click https://stackoverflow.com/a/16190994
    cellEdit.innerHTML =
      `<nobr style="padding-right:5px">` +
      `<button onclick="deleteSection(${sectionIdx})">DEL</button>` +
      `<button onclick="cueVideo(${stamp})">Cue</button>` +
      `<button onclick="pushSectionTime(${-10 / fs}, ${sectionIdx})">--</button>` +
      `<button onclick="pushSectionTime(${-1 / fs}, ${sectionIdx})">-</button>` +
      `<button onclick="pushSectionTime(${1 / fs},${sectionIdx})">+</button>` +
      `<button onclick="pushSectionTime(${10 / fs},${sectionIdx})">++</button>` +
      `<button onclick="redescribe(${sectionIdx})">Edit</button>` +
      `</nobr>`;
    row.appendChild(cellEdit);
    cellDesc.appendChild(descNode);
    row.appendChild(cellDesc);
    if (level == 0) {
      const currentColor = color;

      cellColor.innerHTML = `
    <div id="picker-${sectionIdx}">
    <input type="text" class="section-color-picker" value="${currentColor}" style="border-color:${currentColor}" name="section-color-picker-${sectionIdx}"> </input>
    <button class="section-picker-close" style="display:none">Done Picking Color</button>
    <div class="section-picker-container"></div></div>`;

      row.appendChild(cellColor);
    }
    $("#table>tbody").append(row);

    if (level == 0)
      $(cellColor)
        .find("input")
        .iris({
          width: 200,
          hide: true,
          target: $(cellColor).find(".section-picker-container"),
          change: (event, ui) => {
            const hsl = ui.color._hsl;
            $(cellColor)
              .find("input")
              .css("border-color", `hsl(${hsl.h},${hsl.s}%,${hsl.l}%)`);
            $(event.target).val(ui.color.toString());
          },
        });
  }
}

$(document).on("focus", ".section-color-picker", (event) => {
  $(event.target)
    .siblings(".section-picker-container")
    .find(".iris-picker")
    .show();
  $(event.target).siblings("button").show();
  setUnsaved();
});
$(document).on("click", ".section-picker-close", (event) => {
  const inputEle = $(event.target).siblings("input.section-color-picker");
  const sectionIdx = inputEle.attr("name").split("-").pop();
  const newColor = inputEle.val();
  // The re-render from this hides the color picker
  recolorSection(newColor, sectionIdx);
});

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

const theaterOffButton = "Enter theater mode";
const theaterOnButton = "Exit theater mode";

// Handles resizing of video player & hiding of buttons when entering/exiting theater mode
function theaterHandler() {
  const currUrl = new URLSearchParams(window.location.search);
  const newSize = theaterActive ? smallPlayerSize : largePlayerSize;
  $(player.h).css({
    height: newSize.height,
    width: newSize.width,
  });
  if (theaterActive) {
    $("#form-column").show();
    $("#video-selection-button").show();
    $("#listen-button").show();
    $("#theater-button").text(theaterOffButton);
    theaterActive = false;
    currUrl.delete("theater");
  } else {
    $("#form-column").hide();
    $("#video-selection-button").hide();
    $("#listen-button").hide();
    $("#theater-button").text(theaterOnButton);
    theaterActive = true;
    currUrl.set("theater", "true");
  }
  window.history.replaceState("", "", "?" + currUrl.toString());
}

const listenOffButton = "Enter listening mode";
const listenOnButton = "Exit listening mode";

function listenHandler() {
  const currUrl = new URLSearchParams(window.location.search);
  const newSize = listenActive ? smallPlayerSize : tinyPlayerSize;
  $(player.h).css({
    height: newSize.height,
    width: newSize.width,
  });
  if (listenActive) {
    $("#form-column > ").show();
    $("#video-selection-button").show();
    $("#theater-button").show();
    $("#listen-button").text(listenOffButton);
    $(".ui-row").css("justify-content", "flex-start");
    $("#video-column").css("order", "1");
    $("#animation-column").css("order", "0");
    listenActive = false;
    currUrl.delete("listen");
  } else {
    $("#form-column > ").hide();
    $("#video-selection-button").hide();
    $("#theater-button").hide();
    $("#listen-button").text(listenOnButton);
    $(".ui-row").css("justify-content", "space-between");
    $("#video-column").css("order", "0");
    $("#animation-column").css("order", "1");
    listenActive = true;
    currUrl.set("listen", "true");
  }
  window.history.replaceState("", "", "?" + currUrl.toString());
}
