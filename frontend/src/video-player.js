var tag = document.createElement("script");

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    ...smallPlayerSize,
    videoId: null,
    events: {
      onReady: onPlayerReady,
      onStateChange: onSectionChange,
    },
    cc_load_policy: 0,
    iv_load_policy: 3,
    modestbranding: 1,
    playsinline: 1,
    rel: 0,
    showinfo: 0,
  });
}

function onPlayerReady() {
  // when the page & player loads, fetch the id from the URL
  const urlId = new URLSearchParams(window.location.search).get("id");
  if (urlId != null) {
    $("#idInput").attr("value", urlId);
    fetchData(urlId);
  }
}

function playFromFirstSection(timeBefore = 0) {
  player.playVideo();
  player.seekTo(Math.max(state.sections[0].time - timeBefore, 0));
}

function onPlayButtonClick() {
  if (!player.getPlayerState || !player.getCurrentTime) return;
  const playerState = player.getPlayerState();
  const currTime = player.getCurrentTime();
  const timeBefore = 2.5;
  if (currTime < state?.sections[0]?.time) {
    if (currTime < state?.sections[0]?.time - timeBefore) {
      playFromFirstSection(timeBefore);
    } else {
      playFromFirstSection();
    }
  } else if (playerState == 1) {
    player.pauseVideo();
  } else if (playerState == 2) {
    player.playVideo();
  }
}

function updateSVGPlaying() {
  const playerState = player.getPlayerState();
  if (!state?.youtubeId || playerState != 1) {
    pauseSVG();
  } else {
    if (player.getCurrentTime) playSVG(player?.getCurrentTime());
  }
}
