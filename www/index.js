let backendUrl = window.location.protocol+"//"+window.location.hostname+":3001"
let videoId;

function onPlayerReady() {
    // when the page loads, fetch the id from the URL
    const urlId = new URLSearchParams(window.location.search).get("id");
    if (urlId!=null) {
        $('#idInput').attr('value',urlId);
        fetchData(urlId)
    }
}

// redirects page to new url with desired ID
function openId(id = document.getElementById('idInput').value) {
    let newUrl= window.location.origin+"/?id="+id;
    window.location.href=newUrl;
}
function fetchData(id) {
    $.get(backendUrl+"/get", {id: id}, function(result){
        result=JSON.parse(result)
        if (result.status) {
            loadData(result.message.data.data)
        }
        else if (!result.status) alert("Error: "+result.message)
    })
}
function loadData(data) {
    replaceData(data);
    loadTable();
    renderSVG(data);
    player.cueVideoById(data.videoId)
}
function uploadData() {
    let data = compileDataAndRender()
    if (data) {
        data=JSON.parse(data)
        $.post(backendUrl+'/add',JSON.stringify(data), function(result){
            result=JSON.parse(result)
            if (!result.status) alert("Error: " + result.message)
            else if (result.status) openId(result.message.id)
        })
    }
}