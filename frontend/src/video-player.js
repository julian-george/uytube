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

function playFromFirstSection() {
  player.playVideo();
  player.seekTo(state.sections[0].time - 2.5);
}

function onPlayButtonClick() {
  if (!player.getPlayerState || !player.getCurrentTime) return;
  const playerState = player.getPlayerState();
  const currTime = player.getCurrentTime();
  if (currTime < state?.sections[0]?.time) {
    playFromFirstSection();
  } else if (playerState == 1) {
    player.pauseVideo();
  } else if (playerState == 2) {
    player.playVideo();
  }
}

function updatePlayButton(currTime) {
  const playButtonEle = $("#play-button > img");
  const playerState = player.getPlayerState();
  if (!state?.youtubeId || playerState == -1) {
    $("#play-button").hide();
  } else {
    $("#play-button").show();
  }

  let imagePath;
  if (currTime < state?.sections[0]?.time) {
    imagePath = "static/next.png";
  } else if (playerState == 1) {
    imagePath = "static/pause.png";
  } else if (playerState == 2) {
    imagePath = "static/play.png";
  }
  if (imagePath != playButtonEle.attr("src")) {
    playButtonEle.attr("src", imagePath);
  }
}
