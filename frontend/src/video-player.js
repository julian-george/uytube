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
    cc_load_policy: 0,
    iv_load_policy: 3,
    modestbranding: 1,
    playsinline: 1,
    rel: 0,
    showinfo: 0,
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

function playFromFirstSection() {
  player.seekTo(nestedData?.content?.[0]?.[0] || 0, true);
  setTimeout(player.playVideo, 500);
  // player.playVideo();
}
