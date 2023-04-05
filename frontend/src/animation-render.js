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

// TODO: change data structure to make this function less convoluted and prone to error
function getCurrentSectionIndex(currentTime) {
  if (nestedData.content.length == 0) return;
  // These are the indexes of the current section within the data's three levels of depth
  let i, j;
  // This is the index of the html row that corresponds to the current section
  let rowIndex = 0;
  // Using for loops to iterate thru the nested data, stopping when a section is found with a greater timestamp than the current time
  for (
    i = 0;
    i < nestedData.content.length - 1 &&
    nestedData.content[i + 1][0] <= currentTime;
    i++
  ) {
    rowIndex += nestedData.content[i][1].content.length;
    if (nestedData.content[i][1].content[0][1].division != "") rowIndex += 1;
  }
  const currentDivision = nestedData.content[i][1];
  for (
    j = 0;
    j < currentDivision.content.length &&
    currentDivision.content[j][0] <= currentTime;
    j++
  ) {
    if (currentDivision.content[j][1].division != "") rowIndex += 1;
  }
  return rowIndex;
}
let arrowUpdateInterval;

// Percentage of window height at which elements on list are considered to be off screen and moved up accordingly
const LIST_MOVE_THRESHOLD = 0.75;

function animateSections(rowIndex = 0) {
  // Clear the interval with each manual update so that the interval doesn't change the arrow right before/after the user does
  if (arrowUpdateInterval) clearInterval(arrowUpdateInterval);

  const arrowElement = $("#section-arrow");
  const arrowHeight = parseFloat(arrowElement.css("height") || 0);
  const currentRowElement = $(`#section-row-${rowIndex}`);
  const textHeight = parseFloat(currentRowElement.css("font-size"));
  const currentRowTop = parseFloat(currentRowElement.position()?.top || 0);

  const listContainerElement = $("div#section-guide");
  const listElement = $("div#section-guide-list");
  const initialListTop = parseFloat(listContainerElement.offset()?.top || 0);
  const screenThreshold = LIST_MOVE_THRESHOLD * window.innerHeight;

  let newListTop = 0;

  const currentRowAbsoluteTop = currentRowTop + initialListTop;

  // If the list starts before the threshold (ie it's on screen) and the current row is past the threshold (ie it'll otherwise be offscreen)
  if (
    screenThreshold > initialListTop &&
    currentRowAbsoluteTop > screenThreshold
  ) {
    newListTop = -1 * (currentRowAbsoluteTop - screenThreshold);
  }

  listElement.animate({ top: `${newListTop}px` }, 150, () => {});

  const currentRowMargin = parseFloat(currentRowElement.css("margin-top") || 0);
  // This calculation ensures that the vertical center of the arrow points to the vertical center of the first line of text
  const newArrowTop =
    currentRowAbsoluteTop +
    (arrowHeight - textHeight) / 2 +
    currentRowMargin +
    newListTop;

  arrowElement.animate({ top: `${newArrowTop}px` }, 150, () => {
    // Only show the arrow once everything has been rendered
    if (newArrowTop) arrowElement.show();
  });
  arrowUpdateInterval = setInterval(() => {
    const rowIndex = getCurrentSectionIndex(player.getCurrentTime());
    animateSections(rowIndex);
  }, 500);
}

$(window).on("load", () => {
  renderSections();
  animateSections(getCurrentSectionIndex(player.getCurrentTime()));
  $(".section-nav").click((event) => {
    const clickedRowIndex = $(event.target)
      .attr("id")
      .replace("section-row-", "");
    animateSections(Number(clickedRowIndex));
  });
});

$(window).on("resize", () => {
  animateSections(getCurrentSectionIndex(player.getCurrentTime()));
});

function renderSections() {
  const sectionElement = $("#section-guide-list");
  sectionElement.html("");
  let rowIndex = 0;
  // Iterate thru nestedData's outer sections and render them
  for (let i = 0; i < nestedData.content.length; i++) {
    const [beginI, contentI] = nestedData.content[i];
    const firstDivision = contentI.content?.[0]?.[1]?.division;
    sectionElement.append(
      `<div style="display:inline-flex">
        <div id="section-row-${rowIndex}" class="section-nav" onclick="player.seekTo(${beginI});">${contentI.section}</div>
        </div>`
    );
    rowIndex++;
    // Iterate thru each section's inner divisions and render them
    for (let j = 0; j < (contentI?.content || []).length; j++) {
      const [beginJ, contentJ] = contentI.content[j];
      if (contentJ.division != "") {
        sectionElement.append(
          `<div id="section-row-${rowIndex}" class="section-nav division" onclick="player.seekTo(${beginJ})"> ${contentJ.division}</div>`
        );
        rowIndex++;
      }
    }
  }
}
