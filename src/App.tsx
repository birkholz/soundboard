import { Button } from "@blueprintjs/core";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import * as React from "react";
import { Component } from "react";
import { Devices } from "./components/Devices";
import FilePicker from "./components/FilePicker";
import Playback, { AudioElement, Output, OutputNumber } from "./playback";

export interface Track {
  file: File;
  // TODO: Edward *will* destroy this
  key: string | null;
}

declare var Audio: {
  new (src?: string): AudioElement;
};

export type Outputs = [Output, Output];

export interface AppState {
  tracks: Track[];
  trackChanging: Track | null;
  devices: MediaDeviceInfo[];
  outputs: Outputs;
  sources: AudioBufferSourceNode[];
}

class App extends Component<{}, AppState> {
  pb: Playback;
  listener: EventListenerOrEventListenerObject;

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
        }
      ],
      sources: []
    };
  }

  bootstrapDevicesAndAudio = async () => {
    const devices = await this.pb.getDevices();
    const [device1, device2] = devices;
    const outputs: Outputs = [await this.pb.setOutput(device1), await this.pb.setOutput(device2)];
    this.setState({
      devices,
      outputs
    });
  };

  componentWillMount() {
    this.bootstrapDevicesAndAudio();
  }

  componentDidMount() {
    document.addEventListener("keydown", event => {
      this.state.tracks.forEach((track: Track) => {
        if (track.key === event.key && !this.state.trackChanging) {
          this.playSound(track.file);
        }
      });
    });
  }

  changeFile = (file: File) => {
    const tracks = this.state.tracks;
    tracks.push({ file, key: null });
    this.setState({ tracks });
  };

  playSound = (track: File) => {
    this.pb.createTrackSource(track).then((source: AudioBufferSourceNode) => {
      const sources = this.state.sources;
      sources.push(source);
      source.start();
      this.setState({ sources });
    });
  };

  stopSound = () => {
    const sources = this.state.sources;
    sources.forEach(s => s.stop());
    this.setState({ sources: [] });
  };

  logFileError = (err: string) => {
    console.log(err);
  };

  changeKey = (track: Track) => {
    this.setState({ trackChanging: track });
    document.addEventListener("keydown", this.finishKey);
  };

  finishKey = (event: KeyboardEvent) => {
    const { tracks, trackChanging } = this.state;
    const newKey = event.keyCode === 27 ? null : event.key;
    if (trackChanging) {
      tracks.forEach(track => {
        if (track === trackChanging) {
          track.key = newKey;
        }
      });
      this.setState({ tracks, trackChanging: null });
    }
    document.removeEventListener("keydown", this.finishKey);
  };

  deleteTrack = (track: Track) => {
    const tracks = this.state.tracks.filter(t => t !== track);
    this.stopSound();
    this.setState({ tracks });
  };

  getKeyText = (track: Track) => {
    if (track === this.state.trackChanging) {
      return "Press any key";
    } else if (!track.key) {
      return "";
    } else {
      return track.key;
    }
  };

  renderTrack = (track: Track, index: number) => {
    const { trackChanging } = this.state;
    const canHaveKeyAssigned = !track.key && !trackChanging;
    const icon = canHaveKeyAssigned ? "insert" : undefined;

    const onPlayClick = () => this.playSound(track.file);
    const onChangeKeyClick = () => this.changeKey(track);
    const onDeleteTrackClick = () => this.deleteTrack(track);
    return (
      <tr key={index}>
        <td>
          <Button onClick={onPlayClick} text={track.file.name} />
        </td>
        <td>
          <Button
            onClick={onChangeKeyClick}
            disabled={trackChanging !== null}
            icon={icon}
            text={this.getKeyText(track)}
          />
        </td>
        <td>
          <Button onClick={onDeleteTrackClick} disabled={trackChanging !== null} icon="trash" />
        </td>
      </tr>
    );
  };

  onDeviceSelect = (device: MediaDeviceInfo, outputNumber: OutputNumber) => {
    const outputs = this.state.outputs;
    this.pb.setOutput(device).then(output => {
      outputs[outputNumber] = output;
      this.setState({ outputs });
    });
  };

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
        <tbody>{tracks.map(this.renderTrack)}</tbody>
      </table>
    );
  };

  render() {
    return (
      <div className="App">
        <Devices devices={this.state.devices} outputs={this.state.outputs} onItemSelect={this.onDeviceSelect} />
        <FilePicker extensions={["wav", "mp3", "ogg"]} onChange={this.changeFile} onError={this.logFileError}>
          <Button text="Add Sound" />
        </FilePicker>
        <Button onClick={this.stopSound} text="Stop" />
        {this.renderTable(this.state.tracks)}
      </div>
    );
  }
}

export default App;
