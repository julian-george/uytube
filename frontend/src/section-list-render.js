// Percentage of window height at which elements on list are considered to be off screen and moved up accordingly
const LIST_MOVE_THRESHOLD = 0.98;

// Where section text will be offset to once threshold is crossed
const VERT_CENTER = window.innerHeight * 0.6;

function animateSections() {
  const arrowElement = $("#section-arrow");
  if (currentSectionIdx == -1) {
    arrowElement.hide();
  }
  const arrowHeight = parseFloat(arrowElement.css("height") || 0);
  const currentRowElement = $(`#section-row-${currentSectionIdx}`);
  if (currentRowElement?.text()?.includes("[End]")) {
    player.pauseVideo();
  }
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
    newListTop = -1 * (currentRowAbsoluteTop - VERT_CENTER);
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
}

$(window).on("load", () => {
  renderSections();
  animateSections();
  $(".section-nav").click((event) => {
    const clickedRowIndex = $(event.target)
      .attr("id")
      .replace("section-row-", "");
    animateSections(Number(clickedRowIndex));
  });
});

$(window).on("resize", () => {
  animateSections();
});

const levelClasses = {
  0: "section",
  1: "division",
  2: "moment",
};

function renderSections() {
  const sectionElement = $("#section-guide-list");
  sectionElement.html("");
  // Iterate thru nestedData's outer sections and render them
  for (let i = 0; i < state.sections.length; i++) {
    const currSection = state.sections[i];
    sectionElement.append(
      `<div style="display:inline-flex">
        <div id="section-row-${i}" class="section-nav ${
        levelClasses[currSection.level]
      }" onclick="player.seekTo(${currSection.time});">${
        currSection.title
      }</div>
      </div>`
    );
  }
}
