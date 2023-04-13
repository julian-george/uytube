const state = {
  youtubeId: null,
  // 1-D array of sections ordered by time
  sections: [],
  // Nested array of objects representing hierarchy of sections
  hierarchy: [],
};

const setState = (newState) => {
  state.youtubeId = newState.youtubeId;
  state.sections = newState.sections;
  onStateChange();
};

const setSections = (newSections) => {
  state.sections = newSections;
  onStateChange();
};

const onStateChange = () => {
  renderPanel();
  renderSections();
  setUnsaved();
};

const updateHierarchy = () => {
  const indices = [0];
  for (let i = 0; i < state.sections.length; i++) {
    const currSection = state.sections[i];
  }
};

const sortSections = (newSections) => {
  return newSections.sort((sectionA, sectionB) => {
    if (sectionA.time == sectionB.time) {
      return sectionA.level - sectionB.level;
    } else {
      return sectionA.time - sectionB.time;
    }
  });
};

// Upon user input (which affects state.sections) iterates thru the new sections array and throws error upon invalid hierarchy
const validateSections = (newSections) => {
  if (newSections.length == 0) return;
  if (newSections[0].level != 0) {
    throw new Error(
      "You must add a section before adding any divisions or moments"
    );
  }
  for (let i = 1; i < newSections.length; i++) {
    const currSection = newSections[i];
    const prevSection = newSections[i - 1];
    if (prevSection.level < currSection.level - 1) {
      if (currSection.level == 1)
        throw new Error("Invalid hierarchy: divisions must belong to sections");
      else if (currSection.level == 2)
        throw new Error("Invalid hierarchy: moments must belong to divisions");
    }
  }
  return newSections;
};

// Takes a time within the video and returns what section index that it falls under
const timeToIndex = (time, level = Infinity) => {
  if (state.sections.length > 0 && time < state.sections[0].time) {
    return -1;
  }
  for (let i = 0; i < state.sections.length; i++) {
    const isFinalSection = i == state.sections.length - 1;
    const currSectionTime = state.sections[i].time;
    const nextSectionTime = state.sections?.[i + 1]?.time || null;
    // If this is the last section or the current time is >= the current section and < the next section
    if (
      isFinalSection ||
      (time >= currSectionTime && time < nextSectionTime) ||
      (level < state.sections[i + 1].level && currSectionTime == time)
    ) {
      return i;
    }
  }
};

const addSection = (title, time, level, color = null) => {
  if (time < 0) time = 0;
  const newSection = {
    title,
    time,
    level,
    color,
  };
  let newSections = [...state.sections, newSection];
  try {
    newSections = validateSections(sortSections(newSections));
    setSections(newSections);
  } catch (e) {
    alert(e.message);
  }
};

const editSection = (index, newSection) => {
  // Validation doesn't happen here because we currently don't use editSection to reorder stuff
  //   if validation ever expands beyond hierarchy enforcement, validate here as well
  state.sections[index] = newSection;
  onStateChange();
};

const retitleSection = (newTitle, sectionIndex) => {
  const oldSection = state.sections[i];
  editSection(sectionIndex, {
    ...oldSection,
    title: newTitle,
  });
};

const recolorSection = (newColor, sectionIndex) => {
  const oldSection = state.sections[sectionIndex];
  editSection(sectionIndex, { ...oldSection, color: newColor });
};

const pushSectionTime = (incrementAmount, sectionIndex) => {
  // Rounding incremented time to 1 decimal place and ensuring it stays above 0
  let newTime = Math.max(
    Math.round((state.sections[sectionIndex].time + incrementAmount) * 10) / 10,
    0
  );
  if (player.getDuration) {
    // Ensuring it stays below video length
    newTime = Math.min(newTime, player.getDuration());
  }
  const newSection = { ...state.sections[sectionIndex], time: newTime };
  let newSections = state.sections.map((section, i) =>
    i == sectionIndex ? newSection : section
  );
  try {
    newSections = validateSections(sortSections(newSections));
    setSections(newSections);
  } catch (e) {
    alert(e.message);
  }
};

const deleteSection = (sectionIndex) => {
  let newSections = state.sections.filter((_section, i) => i != sectionIndex);
  try {
    newSections = validateSections(sortSections(newSections));
    setSections(newSections);
  } catch (e) {
    alert(e.message);
  }
};

const setYoutubeId = (newId) => {
  state.youtubeId = newId;
  onStateChange();
};
