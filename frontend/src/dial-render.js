// This should always be <= the number of levels, and == to the number of dial elements in the HTML
const numDials = 2;

const dialElements = [];

for (let i = 0; i < numDials; i++) {
  dialElements.push($(`#dial-${i}`));
}
