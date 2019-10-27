/*global chrome*/
/*global screen*/
/*global navigator*/

var recording = false;
var recorder = null;

class ScreenRecorder {
    constructor(mediaStream) {
        this.chunks = [];
        this.mediaStream = mediaStream;
        this.mediaRecorder = new MediaRecorder(mediaStream);
        this.mediaRecorder.ondataavailable = this.ondataavailable.bind(this);
        this.mediaRecorder.onstop = this.onstop.bind(this);
        this.mediaRecorder.onerror = this.onerror.bind(this);
    }

    start() {
        this.mediaRecorder.start();
    }

    stop() {
        this.mediaRecorder.stop();
        this.mediaStream.getTracks().forEach(function(track) {
            track.stop();
        });
    }

    ondataavailable(e) {
        this.chunks.push(e.data);
    }

    onerror(event) {
        console.error("Media recorder error", event.error);
    }

    onstop(e) {
        let blob = new Blob(this.chunks, { 'type' : 'video/x-matroska;codecs=avc1' });
        let blobUrl = window.URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = blobUrl;
        a.download = "recording.mkv";
        a.click();
    }
}

chrome.runtime.onInstalled.addListener(function() {
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.action == "captureScreen") {
            recorder = null;
            captureScreen(sendResponse);
        } else if (message.action == "stopCapture") {
            stopCapture(sendResponse);
        } else if (message.action == "getState") {
            sendResponse({success: true, recording: recording});
        }
        // return true: Callback will be async, won't be invalidated when this function returns
        return true;
    });
});

function captureScreen(callback) {
    // This must exist in the extension scope (not content script) since we don't want this
    // page to be created solely in the size of the content script scope.

    let promise = navigator.mediaDevices.getDisplayMedia({
        video: {
            width: screen.width,
            height: screen.height,
            framerate: 60
        }
    });
    promise.then((mediaStream) => {
        recorder = new ScreenRecorder(mediaStream);
        recorder.start();
        recording = true;
        callback({success: true});
    }).catch((error) => {
        console.error("Failed to create stream: ", error.message);
        callback({success: false});
    });
}

function stopCapture(callback) {
    recorder.stop();
    recording = false;
    callback({success: true});
}
