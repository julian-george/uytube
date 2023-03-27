// This file contains global variables that are used between our javascript "modules"
// TODO: switch to a more standardized module library like webpack instead of messy solution of relying on import order for hierarchy

let player;

const smallPlayerSize = { width: "420", height: "250" };
const largePlayerSize = { width: "1080", height: "720" };

// List of alernating colors that will be used before user inputs their own
const defaultColors = ["#7dcffd", "#f69e70", "#fdd998", "#fc468e"];

var nestedData = { content: [] };

function replaceData(newData) {
  nestedData = newData;
}
