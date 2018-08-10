/* tslint:disable */
import { Button } from "@blueprintjs/core";
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import * as React from 'react';
import { Component } from 'react';
import { Devices } from './components/Devices';
import FilePicker from './components/FilePicker';
import Playback, { AudioElement, OutputNumber, Output } from './playback';

export interface Track {
  file: File,
  // TODO: Edward *will* destroy this
  key: string | null,
}

declare var Audio: {
  new(src?: string): AudioElement;
};

export type Outputs = [Output, Output]

export interface AppState {
  tracks: Track[];
  trackChanging: Track | null;
  devices: MediaDeviceInfo[];
  outputs: Outputs;
  sources: AudioBufferSourceNode[];
}

class App extends Component<{}, AppState> {
  pb: Playback
  listener: EventListenerOrEventListenerObject

  constructor(props: {}) {
    super(props);

    this.pb = new Playback();

    this.state = {
      tracks: [],
      trackChanging: null,
      devices: [],
      outputs: [
        {
          label: "Device 1",
          device: Object.create(MediaDeviceInfo),
          audioElement: new Audio()
        },
        {
          label: "Device 2",
          device: Object.create(MediaDeviceInfo),
          audioElement: new Audio()
        },
      ],
      sources: []
    };
  }

  bootstrapDevicesAndAudio = async () => {
    const devices = await this.pb.getDevices();
    const [device1, device2] = devices
    const outputs: Outputs = [
      await this.pb.setOutput(device1),
      await this.pb.setOutput(device2)
    ];
    this.setState({
      devices,
      outputs
    });
  }

  componentWillMount() {
    this.bootstrapDevicesAndAudio();
  }

  componentDidMount() {
    document.addEventListener('keydown', (event) => {
      this.state.tracks.forEach((track: Track) => {
        if (track.key === event.key && !this.state.trackChanging) {
          this._play(track.file);
        }
      });
    });
  }

  _fileChange = (file: File) => {
    let tracks = this.state.tracks;
    tracks.push({file, key:null});
    this.setState({tracks});
  }

  _play = (track: File) => {
    this.pb.createTrackSource(track).then((source) => {
      const sources = this.state.sources;
      sources.push(source);
      this.setState({sources});
    });
  }

  _stop = () => {
    const sources = this.state.sources;
    sources.forEach(function(s){s.stop();});
    this.setState({sources: []});
  }

  _fileError = (err: string) => {
    console.log(err);
  }

  _changeKey = (track: Track) => {
    this.setState({trackChanging: track});
    document.addEventListener('keydown', this._finishKey);
  }

  _finishKey = (event: KeyboardEvent) => {
    const {tracks, trackChanging} = this.state;
    const newKey = event.keyCode === 27 ? null : event.key;
    if (trackChanging) {
      tracks.forEach((track) => {
        if (track === trackChanging) track.key = newKey;
      });
      this.setState({tracks, trackChanging: null});
    }
    // might not work shruggy boy
    document.removeEventListener("keydown", this._finishKey)
  }

  _deleteTrack = (track: Track) => {
    const tracks = this.state.tracks.filter(t => t !== track);
    this._stop();
    this.setState({tracks});
  }

  _keyText = (track: Track) => {
    if (track === this.state.trackChanging) return 'Press any key';
    else if (!track.key) return '';
    else return track.key;
  }

  renderTrack = (track: Track, index: number) => {
    const { trackChanging } = this.state;
    const canHaveKeyAssigned = !track.key && !trackChanging;
    const icon = canHaveKeyAssigned ? 'insert' : undefined;
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
            icon={icon}
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

  onDeviceSelect = (device: MediaDeviceInfo, outputNumber: OutputNumber) => {
    const outputs = this.state.outputs;
    this.pb.setOutput(device)
      .then((output) => {
        outputs[outputNumber] = output;
        this.setState({ outputs })
      })
  }

  renderTable = (tracks: Track[]) => {
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
        <Button onClick={() => {this._stop()}} text="Stop"/>
        {this.renderTable(this.state.tracks)}
      </div>
    );
  }
}

export default App;
