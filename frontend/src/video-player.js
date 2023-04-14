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
    },
    cc_load_policy: 0,
    iv_load_policy: 3,
    modestbranding: 1,
    playsinline: 1,
    rel: 0,
    showinfo: 0,
  });
}

function playFromFirstSection() {
  player.playVideo();
  player.seekTo(nestedData?.content?.[0]?.[0] || 0, true);
}
