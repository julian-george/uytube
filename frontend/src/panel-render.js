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
    "Edit section title, use > for hierarchical indentations",
    "> ".repeat(currSection.level) + currSection.title
  )?.trim();
  if (!sectionTitle) return; // previously forebade a blank title
  const split_input = sectionTitle.split(">").map((title) => title.trim());

  // apply a new title to the timestamp at the existing hierarchical level
  retitleSection(
    split_input[level] == undefined ? "[delete me]" : split_input[level],
    sectionIdx
  );

  // remove the entry at the existing hierarchical level if it gets erased while another level is written
  if (
    split_input[level] == "" &&
    split_input.findIndex((title) => title?.length >= 1) != -1
  ) {
    deleteSection(sectionIdx);
  }

  // apply edits at the other hierarchical levels
  for (let m of [2, 1, 0]) {
    if (m == level) continue;
    const title = split_input[m] || false;
    if (title && title != "") {
      const extantSectionIdx = state.sections.findIndex(
        (section) => section.time == timestamp && section.level == m
      );
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
  const currentIdx =
    state.sections.length -
      1 -
      state.sections
        .slice().reverse()
        .findIndex((section) => section.time < timestamp) || -1;
  if (currentIdx != -1) {
    redescribe(currentIdx);
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

function handleEntryInput(level) {
  if (!player?.getCurrentTime || !player.getCurrentTime()) return;
  const timestamp = Math.floor(player.getCurrentTime() * 10) / 10;
  const sectionTitle = prompt("Enter title for new section ("
    + ["macro","meso","micro"][level] + " level) at "
    + displayTime(timestamp).split(".")[0]);
  if (sectionTitle == null) return;
  const split_input = sectionTitle.split(">").map((title) => title.trim());
  let idx = 0;
  for (let m = level; m <= 2; m++) {
    addSection(split_input[idx], timestamp, m);
    idx += 1;
    if (idx >= split_input.length) return;
  }
}

function renderPanel() {
  $("div#color-scheme-table>div.color-input-container").remove();
  for (let i = 0; i < state.colorScheme.length; i++) {
    $("div#color-scheme-table").append(
      `<div class="color-input-container" id="color-scheme-${i}-container">
        <div class="color-input-top-row">
          <button class="scheme-delete" onclick="removeColor(${i})">DEL #${i+1}</button>
          <input id="color-scheme-${i}" class="color-input" value="${state.colorScheme[i]}" style="border-color:${state.colorScheme[i]}"></input>
          <button class="section-picker-close" style="display:none">Collapse</button>
        </div>
      </div>`
    );
    $(`#color-scheme-${i}`).iris({
      width: 200,
      hide: true,
      target: $(`#color-scheme-${i}-container`),
      change: (event, ui) => {
        const hsl = ui.color._hsl;
        $(event.target).css(
          "border-color",
          `hsl(${hsl.h},${hsl.s}%,${hsl.l}%)`
        );
        $(event.target).val(ui.color.toString());
      },
    });
  }
  if (!state.sections || !state.sections.length) return null;
  $("#table>tbody>.panel-row").remove();
  for (let sectionIdx = 0; sectionIdx < state.sections.length; sectionIdx++) {
    const section = state.sections[sectionIdx];
    if (section?.invisible) continue;
    const { time, level, title, color } = section;
    const stamp = time;

    const row = document.createElement("TR");
    row.className = "panel-row";
    const cellTime = document.createElement("TD");
    const cellEdit = document.createElement("TD");
    const cellDesc = document.createElement("TD");
    const cellColor = document.createElement("TD");
    cellDesc.className = "cell-description clickable";
    if (section.level == 0 && section.colorIndex === undefined) {
      recolorSection(
        sectionIdx,
        // This approximates the desired color scheme index by finding the number of index inputs rendered before it
        $(".scheme-input").length % state.colorScheme.length
      );
      return;
    }

    const descNode = document.createTextNode("> ".repeat(level) + title);

    const timeNode = document.createTextNode(displayTime(stamp).toString());
    cellTime.appendChild(timeNode);
    row.appendChild(cellTime);

    // TO DO: use ctrl+click https://stackoverflow.com/a/16190994
    cellEdit.innerHTML =
      `<nobr style="padding-right:5px">` +
      `<button onclick="deleteSection(${sectionIdx})">DEL</button>` +
      `<button onclick="cueVideo(${stamp})">Cue</button>` +
      `<button onclick="pushSectionTime(${
        -10 / fs
      }, ${sectionIdx})">--</button>` +
      `<button onclick="pushSectionTime(${
        -1 / fs
      }, ${sectionIdx})">-</button>` +
      `<button onclick="pushSectionTime(${1 / fs},${sectionIdx})">+</button>` +
      `<button onclick="pushSectionTime(${
        10 / fs
      },${sectionIdx})">++</button>` +
      `<button onclick="redescribe(${sectionIdx})">Edit</button>` +
      `</nobr>`;
    row.appendChild(cellEdit);
    cellDesc.appendChild(descNode);
    row.appendChild(cellDesc);
    if (level == 0 && title.trim().toLowerCase() != "[end]") {
      cellColor.innerHTML = `<input type="number" class="scheme-input" id="scheme-input-${sectionIdx}" value="${
        section.colorIndex + 1
      }"></input>`;

      row.appendChild(cellColor);
      $(cellColor).on("input", (event) => {
        recolorSection(sectionIdx, Number(event.target.value) - 1);
      });
    }
    $("#table>tbody").append(row);
  }
}

$(document).on("focus", ".color-input", (event) => {
  $(event.target).siblings().find(".iris-picker").show();
  $(event.target).siblings(".section-picker-close").show();
  setUnsaved();
});
$(document).on("click", ".section-picker-close", (event) => {
  const inputEle = $(event.target).siblings("input");
  const schemeIdx = inputEle.attr("id").split("-").pop();
  const newColor = inputEle.val();
  // The re-render from this hides the color picker
  recolorScheme(newColor, schemeIdx);
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
  $("#player").css({
    width: newSize.width,
    height: newSize.height,
    minWidth: newSize.min_width,
    minHeight: newSize.min_height,
    maxWidth: newSize.max_width,
    maxHeight: newSize.max_height
  });
  if (theaterActive) {
    $("#panel-column").show();
    $("#video-selection-button").show();
    $("#video-column").css({marginTop: "10px"});
    $("#listen-button").show();
    $("#theater-button").text(theaterOffButton);
    $("#section-guide").css({maxHeight: "500vh"});
    // $("body").css({backgroundColor: "#FAFAFA"});
    theaterActive = false;
    currUrl.delete("theater");
  } else {
    $("#panel-column").hide();
    $("#video-selection-button").hide();
    $("#video-column").css({marginTop: "0px"});
    $("#listen-button").hide();
    $("#theater-button").text(theaterOnButton);
    $("#section-guide").css({maxHeight: "calc(100vh - 160px)"});
    // $("body").css({backgroundColor: "black"});
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
  $("#player").css({
    height: newSize.height,
    width: newSize.width,
    minWidth: newSize.min_width,
    minHeight: newSize.min_height,
    maxWidth: newSize.max_width,
    maxHeight: newSize.max_height
  });
  if (listenActive) {
    $("#panel-column > ").show();
    $("#panel-column").css({maxWidth: "100vw"});
    $("#video-selection-button").show();
    $("#video-column").css({marginTop: "10px"});
    $("#theater-button").show();
    $("#listen-button").text(listenOffButton);
    $(".ui-row").css("justify-content", "flex-start");
    $("#animation-column").css("order", "0");
    $("#video-column").css("order", "1");
    $("#panel-column").css("order", "2");
    listenActive = false;
    currUrl.delete("listen");
  } else {
    $("#panel-column > ").hide();
    $("#panel-column").css({maxWidth: "0px"});// because tinyPlayerSize.width = 160px and current padding = 35px
    $("#video-selection-button").hide();
    $("#video-column").css({marginTop: "0px"});
    $("#theater-button").hide();
    $("#listen-button").text(listenOnButton);
    $(".ui-row").css("justify-content", "space-between");
    $("#panel-column").css("order", "0");
    $("#animation-column").css("order", "1");
    $("#video-column").css("order", "2");
    listenActive = true;
    currUrl.set("listen", "true");
  }
  window.history.replaceState("", "", "?" + currUrl.toString());
}
