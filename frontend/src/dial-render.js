const dialColors = [];

//TODO: clean up this function
function renderDials() {
  $(".dial-0").remove();
  $(".dial-1").remove();

  const videoRange = player.getDuration() || 1;
  const sectionColors = state.hierarchy.map(
    (section, i) =>
      section?.color || defaultSectionColors[i % defaultSectionColors.length]
  );
  // Array of each sections relative beginning in degrees
  let sectionStarts = [];
  // Array of each section's duration in seconds
  let sectionRanges = [];
  for (let i = 0; i < state.hierarchy.length - 1; i++) {
    // Length of section in seconds
    let sectionRange =
      (state.hierarchy?.[i + 1]?.time || videoRange) - state.hierarchy[i].time;
    sectionRanges.push(sectionRange);
    sectionStarts.push((state.hierarchy[i].time / videoRange) * 180);
  }
  const dialContainerEle = $("#dial-container");

  // For each section, append a dial element.
  //  They will stack on top of each other, and the offset (`from`) makes it so each sections' colors are visible
  for (let i = 0; i < state.hierarchy.length; i++) {
    dialContainerEle.append(
      `<div class="dial-0" style="background-image:conic-gradient(from ${
        sectionStarts[i] - 90
      }deg, ${
        sectionColors[i]
      } 50%, transparent 50%)"><div class="circle-mask"></div></div>`
    );
  }

  // If we are not currently in a section, don't proceed
  if (currentHierarchyIndexes.length == 0 || currentHierarchyIndexes[0] == -1)
    return;

  const currSection = state.hierarchy[currentHierarchyIndexes[0]];

  const divisionColors = currSection.children.map(
    (division, j) =>
      division?.color || defaultDivisionColors[j % defaultDivisionColors.length]
  );

  let divisionStarts = [];
  let divisionRanges = [];

  for (let j = 0; j < currSection.children.length; j++) {
    let divisionRange =
      (currSection.children?.[j + 1]?.time || videoRange) -
      currSection.children[j].time -
      currSection.time;
    divisionRanges.push(divisionRange);
    divisionStarts.push(
      ((currSection.children[j].time - currSection.time) /
        sectionRanges[currentHierarchyIndexes[0]]) *
        180
    );
  }

  dialContainerEle.append(
    `<div class="dial-1" style="background-image:conic-gradient(from -90deg, ${
      defaultDivisionColors[defaultDivisionColors.length - 1]
    } 50%, transparent 50%)"><div class="circle-mask"></div></div>`
  );
  for (let j = 0; j < currSection.children.length; j++) {
    dialContainerEle.append(
      `<div class="dial-1" style="background-image:conic-gradient(from ${
        divisionStarts[j] - 90
      }deg, ${
        divisionColors[j]
      } 50%, transparent 50%)"><div class="circle-mask"></div></div>`
    );
  }
  // Add this back in if we ever give the user the ability to choose division colors
  // const divisionColors = state.hierarchy[
  //   currentHierachyIndexes[0]
  // ].children.map((section) => section.color);
}
function animateIndicator(currTime) {
  const indicatorElement = $("#dial-indicator");

  if (currentHierarchyIndexes[0] == -1) {
    indicatorElement.hide();
    return;
  }
  indicatorElement.show();
  const sectionStart = state.hierarchy?.[currentHierarchyIndexes[0]]?.time || 0;
  const sectionEnd =
    state.hierarchy?.[currentHierarchyIndexes[0] + 1]?.time ||
    player.getDuration();
  const percentElapsed =
    (currTime - sectionStart) / (sectionEnd - sectionStart);
  indicatorElement.css("transform", `rotate(${percentElapsed * 180}deg)`);
}
