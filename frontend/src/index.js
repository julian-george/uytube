// This file contains global variables that are used between our javascript "modules"
// TODO: switch to a more standardized module library like webpack instead of messy solution of relying on import order for hierarchy

let player;

const tinyPlayerSize = {
  width: "160px",
  height: "90px",
  min_width: "auto",
  min_height: "auto",
  max_width: "auto",
  max_height: "auto"
};
const smallPlayerSize = {
  width: "272px",
  height: "153px",
  min_width: "auto",
  min_height: "auto",
  max_width: "auto",
  max_height: "auto"
};
const largePlayerSize = {
  width: "100vw",
  height: "100vh",
  min_width: "272px",
  min_height: "153px",
  max_width: "calc(100vw - 290px)",
  max_height: "calc(100vh - 0px - 38px)"
};

// List of alernating colors that will be used before user inputs their own
const defaultMacroColors = ["#7dcffd", "#f69e70", "#fdd998", "#fc468e"];
const defaultMesoColors = ["#555", "#BBB"];

const numLevels = 3;

// Current index within state.sections
// Set as -1 so that when first entry is added to state.content, onSectionChange() is called
let currentSectionIdx = -1;

// Current indices within state.hierarchy
//   if the current time isn't within one of the sublevels, the index for that level will be -1
let currentHierarchyIndexes = [];

const onSectionChange = () => {
  animateSections();
  if (player.getCurrentTime) playSVG(player?.getCurrentTime());
};

setInterval(() => {
  if (!player?.getCurrentTime) return;
  const currTime = player?.getCurrentTime() || 0;
  const newSectionIndex = timeToSectionIdx(currTime);
  const newHierarchyIndices = timeToHierarchyIdx(currTime);
  if (newSectionIndex != currentSectionIdx) {
    currentSectionIdx = newSectionIndex;
    currentHierarchyIndexes = newHierarchyIndices;
    onSectionChange();
    if (
      state.sections?.[currentSectionIdx]?.title
        ?.toLowerCase()
        ?.includes("[end]")
    ) {
      player.pauseVideo();
    }
  }
  updateSVGPlaying(); // unnecessary to call this constantly
}, 50);

// The amount of seconds that the arrow keys change the player's time
const SECONDS_TO_SEEK = 5;

const SECONDS_TO_SKIP = 15;

// Handles arrow shortcuts to seek when the player isn't focused
document.onkeydown = (e) => {
  const nudgeAmount = e.shiftKey ? SECONDS_TO_SKIP : SECONDS_TO_SEEK;
  if (!player) return;
  if (e.key == "ArrowLeft") {
    player.seekTo(Math.max(player.getCurrentTime() - nudgeAmount, 0));
  } else if (e.key == "ArrowRight") {
    player.seekTo(player.getCurrentTime() + nudgeAmount);
  }
};
