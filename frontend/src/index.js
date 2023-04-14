// This file contains global variables that are used between our javascript "modules"
// TODO: switch to a more standardized module library like webpack instead of messy solution of relying on import order for hierarchy

let player;

const tinyPlayerSize = { width: "240", height: "120" };
const smallPlayerSize = { width: "420", height: "250" };
const largePlayerSize = { width: "1080", height: "92.5vh" };

// List of alernating colors that will be used before user inputs their own
const defaultColors = ["#7dcffd", "#f69e70", "#fdd998", "#fc468e"];

const numLevels = 3;

// Current index within state.sections
// Set as -1 so that when first entry is added to state.content, onSectionChange() is called
let currentSectionIdx = -1;

// Current indices within state.hierarchy
//   if the current time isn't within one of the sublevels, the index for that level will be -1
let currentHierachyIndexes = [];

// The amount of seconds that the arrow keys change the player's time
const SECONDS_TO_SEEK = 5;

// Handles arrow shortcuts to seek when the player isn't focused
document.onkeydown = (e) => {
  if (!player) return;
  if (e.key == "ArrowLeft") {
    player.seekTo(Math.max(player.getCurrentTime() - SECONDS_TO_SEEK, 0));
  } else if (e.key == "ArrowRight") {
    player.seekTo(player.getCurrentTime() + SECONDS_TO_SEEK);
  }
};
