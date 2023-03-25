function playSVG(cue = null) {
  if (cue == null) {
    cue = Math.round(fs * player.getCurrentTime()) / fs;
  }
  let svg = document.getElementById("form_clock");
  svg.setCurrentTime(cue);
  if (![0, 2].includes(player.getPlayerState())) {
    svg.unpauseAnimations();
  }
}
function pauseSVG() {
  let svg = document.getElementById("form_clock");
  svg.pauseAnimations();
}
function renderSVG(newData) {
  let svg = document.getElementById("form_clock");
  svg.setCurrentTime(0);
  replaceData(newData);
  drawForm();
  cue = Math.round(fs * player.getCurrentTime()) / fs;
  svg.setCurrentTime(cue);
}

function getCurrentSectionIndex(currentTime) {
  // These are the indexes of the current section within the data's three levels of depth
  let i, j, k;
  // This is the index of the html row that corresponds to the current section
  let rowIndex = 0;
  // Using for loops to iterate thru the nested data, stopping when a section is found with a greater timestamp than the current time
  for (
    i = 0;
    i < nestedData.content.length - 1 &&
    nestedData.content[i + 1][0] < currentTime;
    i++
  ) {
    rowIndex += nestedData.content[i][1].content.length;
  }
  const currentDivision = nestedData.content[i][1];
  for (
    j = 0;
    j < currentDivision.content.length - 1 &&
    currentDivision.content[j + 1][0] < currentTime;
    j++
  ) {
    rowIndex += 1;
  }
  return rowIndex;
}
function updateArrow(rowIndex = 0) {
  const arrowElement = $("#section-arrow");
  const arrowHeight = parseFloat(arrowElement.css("height"));
  const currentRowElement = $(`#section-row-${rowIndex}`);
  const currentRowHeight = parseFloat(currentRowElement.css("height"));
  const currentRowTop = parseFloat(currentRowElement.offset()?.top || 0);
  const newTop = currentRowTop + currentRowHeight / 2 - arrowHeight / 2;
  arrowElement.animate({ top: `${newTop}px` }, 150, () => {
    // Only show the arrow once everything has been rendered
    if (newTop) arrowElement.show();
  });
}
window.onload = () => {
  renderSections();
  setInterval(() => {
    const rowIndex = getCurrentSectionIndex(player.getCurrentTime());
    updateArrow(rowIndex);
  }, 1000);
  $(".section-nav").click((event) => {
    const clickedRowIndex = $(event.target)
      .attr("id")
      .replace("section-row-", "");
    updateArrow(Number(clickedRowIndex));
  });
};

function renderSections() {
  const sectionElement = $("#section-guide");
  let rowIndex = 0;
  for (let i = 0; i < nestedData.content.length; i++) {
    const [beginI, contentI] = nestedData.content[i];
    const firstDivision = contentI.content?.[0]?.[1]?.division;
    sectionElement.append(
      `<div style="display:inline-flex">
        <div class="color-icon"></div>
        <div id="section-row-${rowIndex}" class="section-nav" onclick="player.seekTo(${beginI});">${
        contentI.section
      } ${firstDivision != "" ? `- ${firstDivision}` : ""}</div>
        </div>`
    );
    rowIndex++;
    for (let j = 1; j < (contentI?.content || []).length; j++) {
      const [beginJ, contentJ] = contentI.content[j];
      sectionElement.append(
        `<div id="section-row-${rowIndex}" class="section-nav division" onclick="player.seekTo(${
          beginJ + 1
        })"> ${contentJ.division}</div>`
      );
      rowIndex++;
      for (let k = 0; k < (contentJ?.content || []).length; k++) {
        const contentK = contentJ[1].content[k];
      }
    }
  }
  updateArrow(rowIndex);
}
