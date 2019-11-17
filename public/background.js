/*global screen*/
/*global navigator*/

var recorder = null;

class ScreenRecorder {
  constructor(mediaStream) {
    this._chunks = [];
    this._recording = false;
    this._mediaStream = mediaStream;
    this._mediaRecorder = new MediaRecorder(mediaStream);
    this._mediaRecorder.ondataavailable = (e) => this.ondataavailable(e);
    this._mediaRecorder.onstop = (e) => this.onstop(e);
    this._mediaRecorder.onerror = (e) => this.onerror(e);
  }

  start() {
    this._mediaRecorder.start();
    this._recording = true;
  }

  stop() {
    this._mediaRecorder.stop();
    this._mediaStream.getTracks().forEach(function(track) { track.stop(); });
    this._recording = false;
  }

  get recording() { return this._recording; }

  ondataavailable(e) { this._chunks.push(e.data); }

  onerror(e) {
    console.error("Media recorder error", e.error);
    this._recording = false;
  }

  onstop(e) {
    let blob =
        new Blob(this._chunks, {'type' : 'video/x-matroska;codecs=avc1'});
    let blobUrl = window.URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = blobUrl;
    a.download = "recording.mkv";
    a.click();
  }
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action == "captureScreen") {
    recorder = null;
    captureScreen(sendResponse);
  } else if (message.action == "stopCapture") {
    stopCapture(sendResponse);
  } else if (message.action == "getState") {
    let recording = false;
    if (recorder !== null) {
      recording = recorder.recording;
    }
    sendResponse({success : true, recording : recording});
  }
  // return true: Callback will be async, won't be invalidated when this
  // function returns
  return true;
});

function captureScreen(callback) {
  // This must exist in the extension scope (not content script) since we don't
  // want this
  // page to be created solely in the size of the content script scope.

  let promise = navigator.mediaDevices.getDisplayMedia(
      {video : {width : screen.width, height : screen.height, framerate : 60}});
  promise
      .then((mediaStream) => {
        recorder = new ScreenRecorder(mediaStream);
        recorder.start();
        callback({success : true});
      })
      .catch((error) => {
        console.error("Failed to create stream: ", error.message);
        callback({success : false});
      });
}

function stopCapture(callback) {
  recorder.stop();
  callback({success : true});
}
