const use_demo_state = false;

const demo_state = { // Purcell Fairy Queen chaconne // demo
  youtubeId: "Ct0GJqRRo_8",
  sections: [
    {"time":1.9,"title":"CONTINUOUS VARIATIONS","colorIndex":0,"level":0},
    {"time":1.9,"title":"Variation 1","level":1},
    {"time":1.9,"title":"`a basic idea","level":2},
    {"time":4.5,"title":"`a′ sequential repetition of basic idea","level":2},
    {"time":7.2,"title":"`b cadential progression (HC)","level":2},
    {"time":12.5,"title":"Variation 2","level":1},
    {"time":23.7,"title":"Variation 3","level":1},
    {"time":34.5,"title":"Variation 4","level":1},
    {"time":45.4,"title":"Variation 5","level":1},
    {"time":56.2,"title":"Variation 6","level":1},
    {"time":67,"title":"Variation 7","level":1},
    {"time":78.3,"title":"Variation 8","level":1},
    {"time":90,"title":"Minore","colorIndex":1,"level":0},
    {"time":90,"title":"Variation 9","level":1},
    {"time":101,"title":"Variation 10","level":1},
    {"time":101,"title":"`c basic idea","level":2},
    {"time":103.8,"title":"`c′ sequential repetition of basic idea","level":2},
    {"time":106.5,"title":"`d′ cadential progression (PAC in major)","level":2},
    {"time":112,"title":"Majore","colorIndex":0,"level":0},
    {"time":112,"title":"Variation 11","level":1},
    {"time":123.1,"title":"Variation 12","level":1},
    {"time":134.1,"title":"Variation 13","level":1},
    {"time":145.1,"title":"Variation 14","level":1},
    {"time":160,"title":"","colorIndex":2,"level":0}
  ],
  hierarchy: [
    {"time":1.9,"title":"CONTINUOUS VARIATIONS","children":[
        {"time":1.9,"title":"Variation 1","children":[
            {"time":1.9,"title":"basic idea"},
            {"time":4.5,"title":"repetition of basic idea (sequential)"},
            {"time":7.2,"title":"cadential progression (HC)"}
          ]},
        {"time":12.5,"title":"Variation 2"},
        {"time":23.7,"title":"Variation 3"},
        {"time":34.5,"title":"Variation 4"},
        {"time":45.4,"title":"Variation 5"},
        {"time":56.2,"title":"Variation 6"},
        {"time":67,"title":"Variation 7"},
        {"time":78.3,"title":"Variation 8"}
      ]},
    {"time":90,"title":"Minore","children":[
        {"time":90,"title":"Variation 9"},
        {"time":101,"title":"Variation 10","children":[
            {"time":101,"title":"basic idea"},
            {"time":103.2,"title":"repetition of basic idea (sequential)"},
            {"time":106.5,"title":"cadential progression (PAC in major)"}
          ]}
      ]},
    {"time":112,"title":"Majore","children":[
        {"time":112,"title":"Variation 11"},
        {"time":123.1,"title":"Variation 12"},
        {"time":134.1,"title":"Variation 13"},
        {"time":145.1,"title":"Variation 14"}
      ]},
    {"time":160,"title":""}
  ],
  colorScheme: [
    "#7dcffd",
    "#f69e70"
  ]
};

const state = use_demo_state ? demo_state : {
  youtubeId: null,
  // 1-D array of sections ordered by time
  sections: [],
  // Nested array of objects representing hierarchy of sections
  hierarchy: [],
  colorScheme: [...defaultMacroColors],
};

const setState = (newState) => {
  state.youtubeId = newState.youtubeId;
  state.sections = newState.sections;
  state.colorScheme = newState?.colorScheme || [...defaultMacroColors];
  onStateChange();
};

const setSections = (newSections) => {
  state.sections = newSections;
  onStateChange();
};

const generateColorList = () => {
  if (state.sections == undefined) return [];
  let section_colors = [];
  try {
    section_colors = state.sections
      .filter((section) => section.level == 0)
      .filter((section) => section.title.trim().toLowerCase() != "[end]")
      .map(
        (section) =>
          state.colorScheme[section.colorIndex % state.colorScheme.length]
      );
  } catch {
    // When there the colorIndex property is absent, look for the color property (backward compatability)
    section_colors = state.sections
      .filter((section) => section.level == 0)
      .filter((section) => section.title.trim().toLowerCase() != "[end]")
      .map((section) => section.color);
  }
  for (let idx = 1; idx < section_colors.length; idx++) {
    if (section_colors[idx] == section_colors[idx - 1]) {
      console.log(
        "Falling back on default colors because two contiguous sections used the same color"
      );
      return [];
    }
  }
  return section_colors;
};

const onStateChange = () => {
  updateHierarchy();
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

  if (!state.sections || !state.sections.length)
    return (state.hierarchy = newHierarchy);
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
  if (!state.sections || !state.sections.length) return -1;
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

const addSection = (title, time, level, colorIndex = null) => {
  if (time < 0) time = 0;
  if (state.sections == undefined) {
    state.sections = [];
  }
  if (state.colorScheme == undefined) {
    state.colorScheme = [];
  }
  if (!colorIndex) {
    colorIndex = state.sections.length % Math.max(1, state.colorScheme.length);
  }
  const newSection = {
    title,
    time,
    level,
    colorIndex,
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

const recolorSection = (sectionIndex, newColorIndex = null) => {
  const oldSection = state.sections[sectionIndex];
  if (newColorIndex === null) {
    newColorIndex = sectionIndex % state.colorScheme.length;
  } else if (newColorIndex >= state.colorScheme.length || newColorIndex < 0) {
    newColorIndex = oldSection.colorIndex;
  }
  editSection(sectionIndex, { ...oldSection, colorIndex: newColorIndex });
};

const recolorScheme = (newColor, colorIndex) => {
  state.colorScheme[colorIndex] = newColor;
  onStateChange();
  setUnsaved();
};

const addColor = () => {
  const colorTally = isNaN(state?.colorScheme?.length) ? 0 : state.colorScheme.length;
  const placeholderColors = [
    defaultMacroColors[(colorTally + 0) % defaultMacroColors.length],
    defaultMacroColors[(colorTally + 1) % defaultMacroColors.length]
  ];
  if (state.colorScheme == undefined) {
    state.colorScheme = [];
  }
  state.colorScheme.push(
    placeholderColors.find(color => color != state.colorScheme[state.colorScheme.length - 1])
  );
  console.log(state.colorScheme);
  onStateChange();
  setUnsaved();
};

const removeColor = (colorIndex) => {
  state.colorScheme.splice(colorIndex, 1);
  onStateChange();
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
