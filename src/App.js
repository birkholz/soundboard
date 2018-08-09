import React, { Component } from 'react';
import { Button, FormGroup, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';

import FilePicker from './components/FilePicker';
import Playback from './playback';

const pb = new Playback();

class App extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      trackList: [],
      trackChanging: null,
      devices: [],
      device1: null,
      device2: null
    };
  }

  componentWillMount() {
    pb.getDevices().then((devices) => {
      this.setState({
        devices,
        device1: devices[0],
        device2: devices[1]
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
    const { device1, device2 } = this.state;
    pb.setOutputs(device1, device2).then(() => {
      pb.play(track);
    });
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

  deviceRenderer = (device, { handleClick, modifiers }) => {
    return (
      <MenuItem
        active={modifiers.active}
        disabled={modifiers.disabled}
        key={device.deviceId}
        text={device.label}
        onClick={handleClick}
      />
    )
  }

  _renderDevices() {
    const {devices, device1, device2} = this.state;

    return (
      <FormGroup>
        <Select
          id="device1"
          label="Output Device 1"
          filterable={false}
          items={devices}
          itemPredicate={(_, item) => item !== device2}
          itemRenderer={this.deviceRenderer}
          onItemSelect={(item) => {
            this.setState({device1: item})
          }}
          noResults={<MenuItem disabled={true} text="None" />}>
          <Button rightIcon="caret-down"
                  text={device1 ? device1.label : "(Loading...)"} />
        </Select>
        <Select
          id="device2"
          label="Output Device 2"
          filterable={false}
          items={devices}
          itemPredicate={(_, item) => item !== device1}
          itemRenderer={this.deviceRenderer}
          onItemSelect={(item) => {
            this.setState({device2: item})
          }}
          noResults={<MenuItem disabled={true} text="None" />}>
          <Button rightIcon="caret-down"
                  text={device2 ? device2.label : "(Loading...)"} />
        </Select>
      </FormGroup>
    );
  }

  render() {
    let tracks = this.state.trackList.map(this.renderTrack);
    if (tracks.length === 0) {
      tracks = [];
    }
    return (
      <div className="App">
        {this._renderDevices()}
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
