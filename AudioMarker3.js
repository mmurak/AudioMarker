// Globals
const btn = document.getElementById("playButton");
const zoomOutButton = document.getElementById("zoBtn");
const speedWheel = document.getElementById("speedSelector");
const timerArea = document.getElementById("timerField");
const StartField = document.getElementById("startField");
const StopField = document.getElementById("stopField");
const DescField = document.getElementById("expField");
let currentElemNo = 0;
let currentZoomFactor = 10;
let minimumZoomFactor = 10;
let zoomDelta = 5;
let startTime = 0;
let stopTime = 0;

let snippetArray = [];

// Wavesurfer setup
var wavesurfer = WaveSurfer.create({
  container: '#waveform' ,
  waveColor: '#6495ed',
  progressColor: '#b03a2e',
  backend: 'MediaElement'     // it is to change speed without affecting the pitch
});

wavesurfer.on("play", function() {
  btn.value = "Pause";
  speedWheel.disabled = true;
});

wavesurfer.on("pause", function() {
  btn.value = "Play";
  speedWheel.disabled = false;
});

wavesurfer.on("finish", function() {
  logTime(false, "  Paused: ", wavesurfer.getCurrentTime() - 0.01);
  btn.value = "Play";
  speedWheel.disabled = false;
  wavesurfer.seekTo(0);
});

// Stopwatch control
var timer = function() {
  timerArea.value = (Math.floor(wavesurfer.getCurrentTime() * 100.0) / 100.0).toFixed(2);
  if (!wavesurfer.isPlaying()) {
    btn.value = "Play";
  }
};
setInterval(timer, 10);

// File reader
window.addEventListener('DOMContentLoaded', function() {
    var obj1 = document.getElementById("mediaFile");
    obj1.addEventListener("change",function(evt){
        var file = evt.target.files[0];
        wavesurfer.load(window.URL.createObjectURL(file));
        obj1.disabled = true;
    },false);
    let obj2 = document.getElementById("imgfile");
    obj2.addEventListener("change",function(evt){
      let file = evt.target.files[0];
      let cf = document.getElementById("confcanvas");
      let image = new Image();
      image.onload = function() {
        cts.drawImage(image, 0, 0);
      };
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function() {
        let dataUrl = reader.result;
        confcanvas.innerHTML = "<img src='" + dataUrl + "' height='20'>";
      };
      DescField.focus();
    },false);
 });


// Logging section
function logDisplay(start, stop, img, desc) {
  let div = document.createElement("div");
  let line = document.createTextNode(start + "→" + stop + ": [" + img + "]  " + desc);
  document.getElementById("loggingArea").appendChild(line);
  document.getElementById("loggingArea").appendChild(document.createElement("br"));
}

// Called when Play/Pause button is pushed.
function playPause() {
  if (!wavesurfer.isPlaying()) {
//    logTime(true, "Started: ", wavesurfer.getCurrentTime());
    wavesurfer.play();
  } else {
    wavesurfer.pause();
//    logTime(false, "  Paused: ", wavesurfer.getCurrentTime());
  }
}

function markStart() {
  startTime = wavesurfer.getCurrentTime();
  StartField.value = startTime;
  DescField.focus();
}

function markStop() {
  stopTime = wavesurfer.getCurrentTime();
  StopField.value = stopTime;
  DescField.focus();
}

function register() {
  // { "SoundFile" : "xxx", "SnippetArray" : [ { "Start" : sss, "Stop" : sss, "Image" : img, ", "Desc" : desc}, ...] }
  if (startTime >= stopTime) {
    alert("Stop time (" + stopTime + ") should be greater than start time (" + startTime + ").");
    return;
  }
  let oneData = {};
  oneData["Start"] = startTime;
  oneData["Stop"] = stopTime;
  let image = getRealPath(document.getElementById("imgfile").value);
  oneData["Image"] = image;
  let desc = DescField.value;
  oneData["Desc"] = desc;
  snippetArray.push(oneData);
  logDisplay(startTime, stopTime, image, desc);
  startTime = stopTime = "";
  StartField.value = "";
  StopField.value = "";
  DescField.value = "";
//console.log(snippetArray);
}


// Called when rewind 1 sec. button is pushed.
function rewind1second() {
  wavesurfer.skipBackward(1.0);
//  logTime(true, "Rewinded: ", wavesurfer.getCurrentTime());
}

// Called when goto controll is activated.
function goto() {
  var field = document.getElementById("secondsFromStart");
  wavesurfer.skip(field.value - wavesurfer.getCurrentTime());
//  logTime(true, "Jump to: ", wavesurfer.getCurrentTime());
}

// Erase each segment section
function dismissSection(sect) {
  document.getElementById("loggingArea").removeChild(sect);
}

// Called when clear-all-log button is pushed.
function clearLoggingArea() {
  snippetArray = [];
  var baseDiv = document.getElementById("loggingArea");
  while (baseDiv.firstChild) {
    baseDiv.removeChild(baseDiv.lastChild);
  }
}

// Called when zoom-in button is pushed.
function zoomIn() {
  zoomOutButton.disabled = false;
  currentZoomFactor += zoomDelta;
  wavesurfer.zoom(currentZoomFactor);
}

// Called when zoom-out button is pushed.
function zoomOut() {
  if (currentZoomFactor > minimumZoomFactor) {
    currentZoomFactor -= zoomDelta;
    wavesurfer.zoom(currentZoomFactor);
    if (currentZoomFactor == minimumZoomFactor) {
      zoomOutButton.disabled = true;
    }
  }
}

// Called when speed-controll selector is changed.
function speedController(speed) {
  wavesurfer.setPlaybackRate(Number(speed));
}

function getRealPath(str) {
  return str.replace(/.+?fakepath\\/, "");
}

function outputFile() {
  let datatree = {};
  datatree["SoundFile"] = getRealPath(document.getElementById("mediaFile").value);
  datatree["SnippetArray"] = snippetArray;
  let contents = JSON.stringify(datatree, null, "  ");
  var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  var blob = new Blob([ bom, contents ], { "type" : "text/plain" });
  if (window.navigator.msSaveBlob) { 
    window.navigator.msSaveBlob(blob, "data.json"); 
    window.navigator.msSaveOrOpenBlob(blob, "data.json"); 
  } else {
    document.getElementById("osf").href = window.URL.createObjectURL(blob);
  }
}

