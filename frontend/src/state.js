const state = {
  youtubeId: null,
  sections: [],
};

const onStateChange = () => {
  renderPanel();
  setUnsaved();
};

const addSection = (title, time, level, color = null) => {
  if (time < 0) time = 0;
  const newSection = {
    title,
    time,
    level,
    color,
  };

  let i = 0;
  if (state.sections.length > 0) {
    const currSection = state.sections[i];
    while (
      i < state.sections.length &&
      ((currSection.time <= time && currSection.level > level) ||
        currSection.time < time)
    )
      i++;
    state.sections.splice(i, 0, newSection);
  } else {
    state.sections.push(newSection);
  }
  onStateChange();
};

const editSection = (index, newSection) => {
  state.sections[index] = newSection;
  onStateChange();
};

const pushSectionTime = (incrementAmount, sectionIndex) => {
  const oldSection = state.sections[sectionIndex];
  // We delete it and re-add it because the new time changes the display order
  deleteSection(sectionIndex);
  // This could be made cleaner
  addSection(
    oldSection.title,
    Math.round((oldSection.time + incrementAmount) * 10) / 10,
    oldSection.level,
    oldSection.color
  );
};

const retitleSection = (newTitle, sectionIndex) => {
  const oldSection = state.sections[i];
  editSection(sectionIndex, {
    ...oldSection,
    title: newTitle,
  });
};

const deleteSection = (sectionIndex) => {
  state.sections.splice(sectionIndex, 1);
  onStateChange();
};

const setYoutubeId = (newId) => {
  state.youtubeId = newId;
  onStateChange();
};
