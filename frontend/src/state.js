const state = {
  youtubeId: null,
  sections: [],
};

const setState = (newState) => {
  state.youtubeId = newState.youtubeId;
  state.sections = newState.sections;
  onStateChange();
};

const onStateChange = () => {
  renderPanel();
  renderSections();
  setUnsaved();
};

const sortState = () => {
  state.sections = state.sections.sort((sectionA, sectionB) => {
    if (sectionA.time == sectionB.time) {
      return sectionA.level - sectionB.level;
    } else {
      return sectionA.time - sectionB.time;
    }
  });
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
    // If this is the last section and the current time is >= the current section and < the next section
    if (
      isFinalSection ||
      (level < state.sections[i + 1].level && currSectionTime == time) ||
      (time >= currSectionTime && time < nextSectionTime)
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
  state.sections.push(newSection);
  sortState();
  onStateChange();
};

const editSection = (index, newSection) => {
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
  state.sections[sectionIndex].time = newTime;
  sortState();
  onStateChange();
};

const deleteSection = (sectionIndex) => {
  state.sections.splice(sectionIndex, 1);
  onStateChange();
};

const setYoutubeId = (newId) => {
  state.youtubeId = newId;
  onStateChange();
};
