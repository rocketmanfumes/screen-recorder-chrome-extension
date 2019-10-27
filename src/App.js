/*global chrome*/
/*global navigator*/
import React from 'react';
import './App.css';

class ScreenRecordButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {recording: false};
        chrome.runtime.sendMessage({action: "getState"},
            function(result) {
                if (result && result.success) {
                    this.setState({recording: result.recording});
                }
            }.bind(this)
        );
    }

    render() {
        if (!this.state.recording) {
            return(<button onClick={() => this.recordScreen()}>Record</button>);
        } else {
            return(<button onClick={() => this.stopRecording()}>Stop Recording</button>);
        }
    }

    recordScreen() {
        chrome.runtime.sendMessage({action: "captureScreen"},
            function(result) {
                var lastError = chrome.runtime.lastError;
                if (lastError) {
                    console.log(lastError.message);
                    // 'Could not establish connection. Receiving end does not exist.'
                    return;
                }

                if (result && result.success) {
                    console.log("We are now recording");
                    this.setState({recording: true});
                } else {
                    console.error("Failed to start stream");
                }
            }.bind(this)
        );
    }

    stopRecording() {
        chrome.runtime.sendMessage({action: "stopCapture"},
            function(result) {
                if (result && result.success) {
                    console.log("Stopped recording");
                    this.setState({
                        recording: false,
                    });
                } else {
                    console.error("Failed to stop capturing");
                }
            }.bind(this)
        );
    }
}

class App extends React.Component {
    render() {
        return (
        <div className="App">
          <header className="App-header">
            <h1>Screen Recorder</h1>
          </header>
          <ScreenRecordButton />
        </div>
        );
    }
}

export default App;
