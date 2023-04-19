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

function cueVideo(r) {
  entry = r.parentNode.parentNode.firstChild;
  stamp = Math.round(fs * Number(entry.innerHTML)) / fs;
  player.playVideo();
  player.seekTo(stamp);
}

const levelPrefixes = {
  0: "",
  1: ">",
  2: ">>",
};

function redescribe(sectionIdx) {
  const currSection = state.sections[sectionIdx];
  let newTitle = prompt(
    "Describe",
    levelPrefixes[currSection.level] + " " + currSection.title
  )?.trim();
  if (!newTitle || newTitle == "") return;
  let newLevel = 0;
  // iterate thru the prefixes until a prefix is found at the beginning of the inputted title
  //   iterate from the last prefix because earlier prefixes are substrings of later prefixes (ie > is a substring of >>)
  for (let level = Object.keys(levelPrefixes).length - 1; level >= 1; level--) {
    if (newTitle.indexOf(levelPrefixes[level]) == 0) {
      newLevel = level;
      break;
    }
  }
  // based on the parsed level, cut out the respective prefix before saving
  //   if level is 0, length - 1 will be -1, so ignore in that case
  // .trim() removes white space between prefix and and title
  if (newLevel != 0)
    newTitle = newTitle.substring(levelPrefixes[newLevel].length).trim();
  if (newLevel != currSection.level)
    editSection(
      sectionIdx,
      { ...currSection, title: newTitle, level: newLevel },
      true
    );
  else retitleSection(newTitle, sectionIdx);
}

function newYoutubeSelection() {
  const idInput = prompt("Enter new Youtube ID", state?.youtubeId || "");
  if (!idInput || idInput == "") return;
  const parsedId = new URLSearchParams(idInput.split("?")?.[1] || idInput).get(
    "v"
  );
  setYoutubeId(parsedId);
}

function handleEntryInput(level) {
  if (!player?.getCurrentTime || !player.getCurrentTime()) return;
  const sectionTitle = prompt("Input section name");
  addSection(
    sectionTitle,
    Math.floor(player.getCurrentTime() * 10) / 10,
    level
  );
}

function renderPanel() {
  $("#table>tbody>.panel-row").remove();
  for (let sectionIdx = 0; sectionIdx < state.sections.length; sectionIdx++) {
    const section = state.sections[sectionIdx];
    if (section?.invisible) continue;
    const { time, level, title, color } = section;
    if (level == 0 && !color) {
      recolorSection(
        defaultSectionColors[sectionIdx % defaultSectionColors.length],
        sectionIdx
      );
      // After recoloring, return early to prevent duplicate render
      return;
    }
    const stamp = time;

    const row = document.createElement("TR");
    row.className = "panel-row";
    const cellTime = document.createElement("TD");
    const cellCtrl = document.createElement("TD");
    const cellDesc = document.createElement("TD");
    const cellColor = document.createElement("TD");
    cellDesc.className = "cell-description clickable";

    const descNode = document.createTextNode(
      levelPrefixes[level] + " " + title
    );

    const timeNode = document.createTextNode(stamp.toString());

    cellTime.appendChild(timeNode);
    row.appendChild(cellTime);
    cellCtrl.innerHTML =
      `<button onclick="deleteSection(${sectionIdx})">Delete</button>` +
      '<button onclick="cueVideo(this)">Cue video</button>' +
      `<button onclick="pushSectionTime(${
        -1 / fs
      }, ${sectionIdx})">-</button>` +
      `<button onclick="pushSectionTime(${1 / fs},${sectionIdx})">+</button>` +
      `<button onclick="redescribe(${sectionIdx})">Redescribe</button>`;
    row.appendChild(cellCtrl);
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
