// This file contains global variables that are used between our javascript "modules"
// TODO: switch to a more standardized module library like webpack instead of messy solution of relying on import order for hierarchy

let player;

const smallPlayerSize = { width: "640", height: "380" };
const largePlayerSize = { width: "1080", height: "720" };

var nestedData = {};

function replaceData(newData) {
  nestedData = newData;
}
