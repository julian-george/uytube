// Percentage of window height at which elements on list are considered to be off screen and moved up accordingly
const LIST_MOVE_THRESHOLD = 0.85;

// Where section text will be offset to once threshold is crossed
const VERT_CENTER = window.innerHeight * 0.6;

function animateSections() {
  const arrowElement = $("#section-arrow");
  if (currentSectionIdx == -1) {
    arrowElement.hide();
  }
  const arrowHeight = parseFloat(arrowElement.css("height") || 0);
  const currentRowElement = $(`#section-row-${currentSectionIdx}`);
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
  // This calculation ensures that the vertical center of the arrow points to the vertical center of the first line of text
  const newArrowTop =
    currentRowAbsoluteTop + (arrowHeight - textHeight) / 2 + newListTop - 2;

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
    // If there isn't a section of the same level after this one
    const lastOfLevel = state.sections?.[i + 1]?.level == currSection.level;
    // The tree-element, consisting of a top and bottom half, with bottom half only rendered if curr row isn't last of level
    const treeElement = `<div class="tree-container">
    <div class="top-tree"></div>
    ${lastOfLevel ? `<div class="bottom-tree"></div>` : ""}
    </div>`;

    sectionElement.append(
      `<div style="margin-left:${
        currSection.level * 16
      }px;" class="section-row ${currSection.level == 0 ? "top-level" : ""}">
        ${currSection.level != 0 ? treeElement : ""}
        <div id="section-row-${i}" class="section-nav ${
        levelClasses[currSection.level]
      }" onclick="player.seekTo(${currSection.time});">${
        currSection.title
      }</div>
      </div>`
    );
  }
}
