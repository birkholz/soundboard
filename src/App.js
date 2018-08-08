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
      trackChanging: null
    };
  }

  componentDidMount() {
    document.addEventListener('keydown', (event) => {
      this.state.trackList.forEach((track) => {
        if (track.key == event.key) {
          this._play(track.file);
        }
      });
    });
  }

  _fileChange = file => {
    let trackList = this.state.trackList;
    trackList.push({file, key:null});
    this.setState({trackList});
  }

  _play = (track) => {
    if (pb.outputs != []) {
      pb.setOutputs().then(() => {
        pb.play(track);
      });
    } else {
      pb.play(track);
    }
  }

  _fileError = err => {
    console.log(err);
  }

  _changeKey = (track) => {
    this.setState({trackChanging: track});
    this.listener = document.addEventListener('keydown', this._finishKey);
  }

  _finishKey = (event) => {
    const {trackList, trackChanging} = this.state;
    if (trackChanging) {
      trackList.forEach((track) => {
        if (track === trackChanging) track.key = event.key;
      });
      this.setState({trackList, trackChanging: null});
    }
    delete this.listener;
  }

  render() {
    const { trackList, trackChanging } = this.state;

    let tracks = trackList.map((track, index) => (
      <tr>
        <td>
          <button key={index} onClick={() => {this._play(track.file)}}>{track.file.name}</button>
        </td>
        <td>
          <span>Key: {track.key}</span>
          <button onClick={() => {this._changeKey(track)}} disabled={trackChanging != null}>{track === trackChanging ? 'Press any key' : 'Change'}</button>
        </td>
      </tr>
    ));
    if (tracks.length === 0) {
      tracks = [];
    }
    return (
      <div className="App">
        <FilePicker
          extensions={['wav', 'mp3', 'ogg']}
          onChange={this._fileChange}
          onError={this._fileError}>
          <button>Select Sound</button>
        </FilePicker>
        <button onClick={() => {pb.stop()}}>Stop</button>
        <table>
        {tracks}
        </table>
      </div>
    );
  }
}

export default App;
