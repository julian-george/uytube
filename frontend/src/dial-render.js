// This should always be <= the number of levels, and == to the number of dial elements in the HTML
const numDials = 2;

const dialElements = [];

for (let i = 0; i < numDials; i++) {
  dialElements.push($(`#dial-${i}`));
}

const dialState = [];

// Upon data in the global state updating, processes it and updates dialState
const updateDialState = () => {
  const levelIndices = [];
  for (let i = 0; i < state.sections.length; i++) {
    const currSection = state.sections[i];
    // if (currSection.level > level)
  }
};
