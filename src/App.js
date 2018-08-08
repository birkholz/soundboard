import React, { Component } from 'react';

import './App.css';
import FilePicker from './components/FilePicker';
import Playback from './playback';

const pb = new Playback();

class App extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      trackList: [],
    };
  }

  _fileChange = file => {
    let trackList = this.state.trackList;
    trackList.push(file);
    this.setState({trackList});
  }

  _play = (track) => {
    if (!pb.outputs) {
      pb.setOutputs().then(() => {
        pb.play(track);
      });
    } else {
      pb.play(track);
    }
  }

  _stop = () => {
    pb.stop();
  }

  _fileError = err => {
    console.log(err);
  }

  render() {
    let tracks = this.state.trackList.map((track, index) => (
      <button key={index} onClick={() => {this._play(track)}}>{track.name}</button>
    ));
    if (tracks.length === 0) {
      tracks = [];
    }
    return (
      <div className="App">
        <FilePicker
          extensions={['wav', 'mp3', 'ogg']}
          onChange={this._fileChange}
          onError={this._fileError}
        >
          <button>Select Sound</button>
        </FilePicker>
        <button onClick={this._stop}>Stop</button>
        {tracks}
      </div>
    );
  }
}

export default App;
