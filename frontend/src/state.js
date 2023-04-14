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
  updateHierarchy();
  setUnsaved();
  renderDials();
  renderPanel();
  renderSections();
};

const updateHierarchy = () => {
  // Reset the old hierarchy first
  state.hierarchy = [];

  // Stores the current index within the hierarchy at each level, so we know where to add each section
  //   ie, if sections[i] is the first moment within division 2 of section 3, indices = [2, 1, 0]
  let indices = [];

  for (let i = 0; i < state.sections.length; i++) {
    // Giving sections a children property to store subsections
    const currSection = { ...state.sections[i], children: [] };
    // If entering a higher level (more nested), add a 0 to indices to represent the index at this new level
    if (currSection.level >= indices.length) {
      indices.push(0);
      // If remaining at the same level, increment the index for that level
    } else if (currSection.level == indices.length - 1) {
      indices[currSection.level]++;
      // If going to a lower level, remove indices until the number of indices is the same as the level
    } else if (currSection.level < indices.length - 1) {
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
        state.hierarchy.push(currSection);
        break;
      case 1:
        state.hierarchy[indices[0]].children.push(currSection);
        break;
      case 2:
        state.hierarchy[indices[0]].children[indices[1]].children.push(
          currSection
        );
        break;
    }
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
    while (
      time >= (sectionList?.[sectionIdx + 1]?.time || player.getDuration())
    ) {
      sectionIdx++;
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
  const oldSection = state.sections[sectionIndex];
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
  player.cueVideoById(state.youtubeId);
  onStateChange();
};

const downloadData = () => {
  const dataStr =
    "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "uytube-export.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

const importData = () => {
  // https://stackoverflow.com/questions/36127648/uploading-a-json-file-and-using-it
  // adapted
  const files = document.getElementById("selectFiles").files;
  if (files.length <= 0) return;

  const fr = new FileReader();

  fr.onload = function (e) {
    const result = JSON.parse(e.target.result);
    loadData(result);
  };

  fr.readAsText(files.item(0));
};
