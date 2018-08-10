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
      tracks: [],
      trackChanging: null,
      devices: [],
      outputs: [],
    };
  }

  componentWillMount() {
    pb.getDevices().then((devices) => {
      const outputs = [devices[0], devices[1]];
      this.setState({
        devices,
        outputs
      });
    });
  }

  componentDidMount() {
    document.addEventListener('keydown', (event) => {
      this.state.tracks.forEach((track) => {
        if (track.key === event.key && !this.state.trackChanging) {
          this._play(track.file);
        }
      });
    });
  }

  _fileChange = file => {
    let tracks = this.state.tracks;
    tracks.push({file, key:null});
    this.setState({tracks});
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
    const {tracks, trackChanging} = this.state;
    const newKey = event.keyCode === 27 ? null : event.key;
    if (trackChanging) {
      tracks.forEach((track) => {
        if (track === trackChanging) track.key = newKey;
      });
      this.setState({tracks, trackChanging: null});
    }
    delete this.listener;
  }

  _deleteTrack = (track) => {
    const tracks = this.state.tracks.filter(t => t !== track);
    pb.stop();
    this.setState({tracks});
  }

  _keyText = (track) => {
    if (track === this.state.trackChanging) return 'Press any key';
    else if (!track.key) return '';
    else return track.key;
  }

  renderTrack = (track, index) => {
    const { trackChanging } = this.state;
    return (
      <tr key={index}>
        <td>
          <Button
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

  onDeviceSelect = (device, outputNumber) => {
    const outputs = this.state.outputs;
    pb.setOutput(device)
      .then((output) => {
        outputs[outputNumber] = output;
        this.setState({ outputs })
      })
  }

  renderTable = (tracks) => {
    if (!tracks.length) {
      return;
    }
    return (
      <table className="bp3-html-table bp3-html-table-striped">
        <thead>
          <tr>
            <th>Track</th>
            <th>Keybinding</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map(this.renderTrack)}
        </tbody>
      </table>
    )
  }

  render() {
    return (
      <div className="App">
        <Devices
          devices={this.state.devices}
          outputs={this.state.outputs}
          onItemSelect={this.onDeviceSelect} />
        <FilePicker
          extensions={['wav', 'mp3', 'ogg']}
          onChange={this._fileChange}
          onError={this._fileError}>
          <Button text="Add Sound"/>
        </FilePicker>
        <Button onClick={() => {pb.stop()}} text="Stop"/>
        {this.renderTable(this.state.tracks)}
      </div>
    );
  }
}

export default App;
