// if (videoId==undefined) videoId = nestedData["videoId"];

var tag = document.createElement("script");

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    ...smallPlayerSize,
    videoId: videoId,
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

// function onPlayerReady(event) {
//   event.target.playVideo();
// }

// function stopVideo() {
//   player.stopVideo();
// }

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING) {
    let cue = Math.round(fs * player.getCurrentTime()) / fs;
    playSVG(cue);
  }
  if (
    event.data == YT.PlayerState.PAUSED ||
    event.data == YT.PlayerState.BUFFERING
  ) {
    pauseSVG();
  }
}
