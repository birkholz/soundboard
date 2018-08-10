import { Button } from "@blueprintjs/core";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import * as React from "react";
import { Component } from "react";
import { Devices } from "./components/Devices";
import FilePicker from "./components/FilePicker";
import { keyToAccelerator } from "./keyUtils/";

const electron = window.require('electron').remote;
const { globalShortcut } = electron;

declare global {
  interface Window {
    require: any;
  }
}

interface Track {
  file: File;
  // TODO: Edward *will* destroy this
  key: string | null;
}

interface AudioElement extends HTMLAudioElement {
  setSinkId: (deviceId: string) => Promise<undefined>;
}

declare var Audio: {
  new (src?: string): AudioElement;
};

export type Outputs = [MediaDeviceInfo, MediaDeviceInfo];

interface AppState {
  tracks: Track[];
  trackChanging: Track | null;
  devices: MediaDeviceInfo[];
  outputs: Outputs;
  sources: AudioBufferSourceNode[];
}

export enum OutputNumber {
  One = 0,
  Two = 1
}

class App extends Component<{}, AppState> {
  listener: EventListenerOrEventListenerObject;
  playingTracks: AudioElement[];

  constructor(props: {}) {
    super(props);
    this.playingTracks = [];

    this.state = {
      tracks: [],
      trackChanging: null,
      devices: [],
      outputs: [Object.create(MediaDeviceInfo), Object.create(MediaDeviceInfo)],
      sources: []
    };
  }


  updateDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === "audiooutput");
  };

  componentWillMount() {
    // Set initial outputs
    this.updateDevices().then((devices) => {
      const [device1, device2] = devices;
      const cableInputDevice = devices.find(({ label }) => label.includes("CABLE Input")) || device2;
      const outputs: Outputs = [device1, cableInputDevice];
      this.setState({devices, outputs});
    });
  }

  componentDidMount() {
    // Set listener to update device list if the devices available change
    navigator.mediaDevices.ondevicechange = () => {
      this.updateDevices().then((devices) => this.setState({devices}));
    }
  }

  changeFile = (file: File) => {
    const tracks = this.state.tracks;
    tracks.push({ file, key: null });
    this.setState({ tracks });
  };

  playSound = async (track: File) => {
    const [ output1, output2 ] = this.state.outputs;
    const audio1 = new Audio();
    const audio2 = new Audio();
    await audio1.setSinkId(output1.deviceId);
    await audio2.setSinkId(output2.deviceId);
    const objUrl = URL.createObjectURL(track);
    audio1.src = objUrl;
    audio2.src = objUrl;
    audio1.play();
    audio2.play();
    this.playingTracks.push(audio1);
    this.playingTracks.push(audio2);
  }

  stopAllSounds = () => {
    this.playingTracks.forEach((a) => {
      a.pause();
    });
    this.playingTracks = [];
  };

  logFileError = (err: string) => {
    console.log(err);
  };

  changeKey = (track: Track) => {
    this.setState({ trackChanging: track });
    if (track.key) {
      globalShortcut.unregister(track.key);
    }
    document.addEventListener("keydown", this.finishKey);
  };

  finishKey = (event: KeyboardEvent) => {
    const { tracks, trackChanging } = this.state;
    if (trackChanging && event.keyCode !== 27) {
      tracks.forEach(track => {
        if (track === trackChanging) {
          track.key = keyToAccelerator(event);
          globalShortcut.register(track.key, () => {
            this.playSound(track.file);
          });
        }
      });
    this.setState({ tracks, trackChanging: null });
    }
    document.removeEventListener("keydown", this.finishKey);
  };

  deleteTrack = (track: Track) => {
    const tracks = this.state.tracks.filter(t => t !== track);
    this.stopAllSounds();
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
    outputs[outputNumber] = device;
    this.setState({ outputs });
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
        <Button onClick={this.stopAllSounds} text="Stop" />
        {this.renderTable(this.state.tracks)}
      </div>
    );
  }
}

export default App;
