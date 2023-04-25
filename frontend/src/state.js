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

const generateColorList = () => {
  const section_colors = state.hierarchy.map((section) => section.color);
  let faulty = false;
  for (let idx = 1; idx < section_colors.length; idx++) {
    if (section_colors[idx] == section_colors[idx - 1]) {
      faulty = true;
    }
  }
  console.log(
    "Falling back on default colors because two contiguous sections used the same color"
  );
  return faulty ? [] : section_colors;
};

const onStateChange = () => {
  updateHierarchy();
  // renderDials();
  renderPanel();
  renderSections();
  renderSVG(state.hierarchy, generateColorList());
};

// state.hierarchy is generated from state.sections
const updateHierarchy = () => {
  // Reset the old hierarchy first
  const newHierarchy = [];

  // Stores the current index within the hierarchy at each level, so we know where to add each section
  //   ie, if sections[i] is the first subdivision within division 2 of section 3, indices = [2, 1, 0]
  let indices = [];

  for (let i = 0; i < state.sections.length; i++) {
    // Giving sections a children property to store subsections
    const currSection = { ...state.sections[i], children: [] };
    if (currSection.level >= indices.length) {
      // If entering a higher level (more nested), add a 0 to indices to represent the index at this new level
      indices.push(0);
    } else if (currSection.level == indices.length - 1) {
      // If remaining at the same level, increment the index for that level
      indices[currSection.level]++;
    } else if (currSection.level < indices.length - 1) {
      // If going to a lower level, remove indices until the number of indices is the same as the level
      while (currSection.level < indices.length - 1) {
        indices.pop();
      }
      // Then, increment that index
      indices[currSection.level]++;
    }

    // Now that the indices array has been adjusted, based on the number of indices, push the section to the correct hierarchy level
    switch (currSection.level) {
      // Add cases here if more levels are added in the future
      case 0:
        newHierarchy.push(currSection);
        break;
      case 1:
        newHierarchy[indices[0]].children.push(currSection);
        break;
      case 2:
        newHierarchy[indices[0]].children[indices[1]].children.push(
          currSection
        );
        break;
    }
  }
  state.hierarchy = newHierarchy;
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
  for (let i = 0; i < newSections.length; i++) {
    const currSection = newSections[i];
    // this fallback value helps enforce the first section's level as 0
    const prevSection = newSections?.[i - 1] || { level: -1 };
    if (prevSection.level < currSection.level - 1) {
      const missingParent = {
        time: currSection.time,
        invisible: false,
        title: "   ",
        level: currSection.level - 1,
      };
      console.log({ missingParent: missingParent });
      return validateSections(sortSections([...newSections, missingParent]));
      // if (currSection.level == 1)
      //   throw new Error("Invalid hierarchy: divisions must belong to sections");
      // else if (currSection.level == 2)
      //   throw new Error(
      //     "Invalid hierarchy: subdivisions must belong to divisions"
      //   );
    }
    if (
      prevSection.time != undefined &&
      prevSection.level == currSection.level - 1 &&
      prevSection.time != currSection.time
    ) {
      const missingElderSibling = {
        time: prevSection.time,
        invisible: false,
        title: "   ",
        level: currSection.level,
      };
      console.log({ missingElderSibling: missingElderSibling });
      return validateSections(
        sortSections([...newSections, missingElderSibling])
      );
    }
  }
  return newSections;
};

// Takes a time within the video and returns what section index that it falls under
const timeToSectionIdx = (time, level = Infinity) => {
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

const timeToHierarchyIdx = (time) => {
  const indices = [];
  let sectionList = state.hierarchy;
  for (let levelIdx = 0; levelIdx < numLevels; levelIdx++) {
    if (sectionList.length == 0 || time < sectionList?.[0]?.time) {
      // Push a -1 index if the time doesn't belong to a section of the current level
      indices.push(-1);
      continue;
    }
    let sectionIdx = 0;
    let currTime = sectionList[sectionIdx].time;
    while (
      currTime >= (sectionList?.[sectionIdx + 1]?.time || player.getDuration())
    ) {
      sectionIdx++;
      currTime = sectionList[sectionIdx].time;
    }
    indices.push(sectionIdx);
    sectionList = sectionList?.[sectionIdx]?.children || [];
  }
  return indices;
};

const addSection = (title, time, level, color = null) => {
  if (time < 0) time = 0;
  const newSection = {
    title,
    time,
    level,
    color,
  };
  let newSections = [...state.sections, newSection].filter(
    (section) => !section?.invisible
  );
  try {
    newSections = validateSections(sortSections(newSections));
    setSections(newSections);
  } catch (e) {
    alert(e.message);
  }
  setUnsaved();
};

const editSection = (index, newSection, reorder = false) => {
  // If we mark this operation as one that will change the order, call sorting functions
  if (reorder) {
    // copy of state.sections with newSection replacing the section at given index
    let newSections = state.sections
      .map((section, i) => (i == index ? newSection : section))
      // this .filtering (here and elsewhere) leads to the invisible sections being deleted and re-generated upon each edit
      //   possibly unnecessary time complexity could result, but this is a clean, concise, robust solution
      .filter((section) => !section?.invisible);
    try {
      newSections = validateSections(sortSections(newSections));
      setSections(newSections);
      // TODO: it may not be best to put this here, in case this is called upon initial render
      setUnsaved();
    } catch (e) {
      alert(e.message);
    }
  } else {
    state.sections[index] = newSection;
  }
  onStateChange();
};

const retitleSection = (newTitle, sectionIndex) => {
  const oldSection = state.sections[sectionIndex];
  editSection(sectionIndex, {
    ...oldSection,
    title: newTitle,
  });
  setUnsaved();
};

const recolorSection = (newColor, sectionIndex) => {
  const oldSection = state.sections[sectionIndex];
  editSection(sectionIndex, { ...oldSection, color: newColor });
  setUnsaved();
};

const pushSectionTime = (incrementAmount, sectionIndex) => {
  // Rounding incremented time to 1 decimal place and ensuring it stays above 0
  const oldTime = state.sections[sectionIndex].time;
  let newTime = Math.max(Math.round((oldTime + incrementAmount) * 10) / 10, 0);
  if (player.getDuration) {
    // Ensuring it stays below video length
    newTime = Math.min(newTime, Math.floor(player.getDuration() * 10) / 10);
  }
  let newSections = state.sections
    .map((section) =>
      section.time == oldTime ? { ...section, time: newTime } : section
    )
    .filter((section) => !section?.invisible);
  try {
    newSections = validateSections(sortSections(newSections));
    setSections(newSections);
  } catch (e) {
    alert(e.message);
  }
  setUnsaved();
};

const deleteSection = (sectionIndex) => {
  let newSections = state.sections
    .filter((_section, i) => i != sectionIndex)
    .filter((section) => !section?.invisible);
  try {
    newSections = validateSections(sortSections(newSections));
    setSections(newSections);
  } catch (e) {
    alert(e.message);
  }
  setUnsaved();
};

const setYoutubeId = (newId) => {
  state.youtubeId = newId;
  player.cueVideoById(state.youtubeId);
  onStateChange();
  setUnsaved();
};
