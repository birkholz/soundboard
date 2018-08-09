import React, { Component } from 'react';
import { Button, FormGroup, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';

import FilePicker from './components/FilePicker';
import Playback from './playback';
import { Devices } from './components/Devices';

const pb = new Playback();

class App extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      playback: pb,
      trackList: [],
      trackChanging: null,
      outputs: [],
    };
  }

  componentWillMount() {
    pb.getDevices().then((devices) => {
      this.setState({
        devices,
      });
    });
  }

  componentDidMount() {
    document.addEventListener('keydown', (event) => {
      this.state.trackList.forEach((track) => {
        if (track.key === event.key && !this.state.trackChanging) {
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
      pb.play(track);
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
    const newKey = event.keyCode === 27 ? null : event.key;
    if (trackChanging) {
      trackList.forEach((track) => {
        if (track === trackChanging) track.key = newKey;
      });
      this.setState({trackList, trackChanging: null});
    }
    delete this.listener;
  }

  _deleteTrack = (track) => {
    const trackList = this.state.trackList.filter(t => t !== track);
    pb.stop();
    this.setState({trackList});
  }

  _keyText = (track) => {
    if (track === this.state.trackChanging) return 'Press any key';
    else if (!track.key) return '';
    else return track.key;
  }

  renderTrack = (track, index) => {
    const { trackChanging } = this.state;
    return (
      <tr>
        <td>
          <Button
            key={index}
            onClick={() => {this._play(track.file)}}
            text={track.file.name}/>
        </td>
        <td>
          <Button
            onClick={() => {this._changeKey(track)}}
            disabled={trackChanging !== null}
            icon={!track.key && !trackChanging ? 'insert' : null}
            text={this._keyText(track)} />
        </td>
        <td>
          <Button
            onClick={() => {this._deleteTrack(track)}}
            disabled={trackChanging !== null}
            icon="trash"/>
        </td>
      </tr>
    );
  }

  onItemSelect = (device: MediaDeviceInfo, outputNumber: OutputNumber) => {
    pb.setOutput(device, outputNumber)
      .then(() => this.setState({ pb: pb }))
  }

  render() {
    let tracks = this.state.trackList.map(this.renderTrack);
    if (tracks.length === 0) {
      tracks = [];
    }
    return (
      <div className="App">
        <Devices deviceList={this.state.devices} onItemSelect={pb.setOutput} />
        <FilePicker
          extensions={['wav', 'mp3', 'ogg']}
          onChange={this._fileChange}
          onError={this._fileError}>
          <Button text="Add Sound"/>
        </FilePicker>
        <Button onClick={() => {pb.stop()}} text="Stop"/>
        <table class="bp3-html-table bp3-html-table-striped">
          <thead>
            <tr>
              <th>Track</th>
              <th>Keybinding</th>
            </tr>
          </thead>
          <tbody>
            {tracks}
          </tbody>
        </table>
      </div>
    );
  }
}

export default App;
