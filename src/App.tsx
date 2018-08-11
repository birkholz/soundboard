import { Button } from "@blueprintjs/core";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import { IpcRenderer } from "electron";
import * as React from "react";
import { Component } from "react";
import { Devices } from "./components/Devices";
import FilePicker from "./components/FilePicker";
import { getSoundFileAsDataURI } from "./helpers";
import { keycodeNames } from "./keycodes";

const electron = window.require("electron");

interface Track {
  file: string;
  trackName: string;
  // TODO: Edward *will* destroy this
  keycode: number | null;
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

export interface IOHookKeydownEvent {
  keycode: number;
  rawcode: number;
  type: "keydown";
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

const codeType = window.process.platform === "darwin" ? "keycode" : "rawcode";
const ESCAPE_KEY = window.process.platform === "darwin" ? 1 : 27;

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
    this.updateDevices().then(devices => {
      const [device1, device2] = devices;
      const cableInputDevice = devices.find(({ label }) => label.includes("CABLE Input")) || device2;
      const outputs: Outputs = [device1, cableInputDevice];
      this.setState({ devices, outputs });
    });
  }

  componentDidMount() {
    // Set global keybinding listener
    electron.ipcRenderer.on("keydown", (event: IpcRenderer, message: IOHookKeydownEvent) => {
      if (this.state.trackChanging) {
        this.finishKey(message);
        return;
      }
      this.state.tracks.forEach((track: Track) => {
        if (track.keycode === message[codeType] && !this.state.trackChanging) {
          this.playSound(track.file);
        }
      });
    });
    // Set listener to update device list if the devices available change
    navigator.mediaDevices.ondevicechange = () => {
      this.updateDevices().then(devices => this.setState({ devices }));
    };
  }

  changeFile = (file: File) => {
    getSoundFileAsDataURI(file).then((soundBinary: string) => {
      this.setState({
        tracks: [
          ...this.state.tracks,
          {
            file: soundBinary,
            trackName: file.name,
            keycode: null
          }
        ]
      });
    });
  };

  playSound = async (track: string) => {
    const [output1, output2] = this.state.outputs;
    const audio1 = new Audio(track);
    const audio2 = new Audio(track);
    await audio1.setSinkId(output1.deviceId);
    await audio2.setSinkId(output2.deviceId);
    audio1.play();
    audio2.play();
    this.playingTracks.push(audio1);
    this.playingTracks.push(audio2);
  };

  stopAllSounds = () => {
    this.playingTracks.forEach(audioElement => {
      audioElement.pause();
    });
    this.playingTracks = [];
  };

  logFileError = (err: string) => {
    console.log(err);
  };

  changeKey = (track: Track) => {
    this.setState({ trackChanging: track });
  };

  finishKey = (event: IOHookKeydownEvent) => {
    const { tracks, trackChanging } = this.state;
    const eventCode = event[codeType];
    const newKey = eventCode === ESCAPE_KEY ? null : eventCode;
    if (trackChanging) {
      tracks.forEach(track => {
        if (track === trackChanging) {
          track.keycode = newKey;
        }
      });
      this.setState({ tracks, trackChanging: null });
    }
  };

  deleteTrack = (track: Track) => {
    const tracks = this.state.tracks.filter(t => t !== track);
    this.stopAllSounds();
    this.setState({ tracks });
  };

  getKeyText = (track: Track) => {
    if (track === this.state.trackChanging) {
      return "Press any key";
    } else if (!track.keycode) {
      return "";
    } else {
      return keycodeNames[track.keycode];
    }
  };

  renderTrack = (track: Track, index: number) => {
    const { trackChanging } = this.state;
    const canHaveKeyAssigned = !track.keycode && !trackChanging;
    const icon = canHaveKeyAssigned ? "insert" : undefined;

    const onPlayClick = () => this.playSound(track.file);
    const onChangeKeyClick = () => this.changeKey(track);
    const onDeleteTrackClick = () => this.deleteTrack(track);
    return (
      <tr key={index}>
        <td>
          <Button onClick={onPlayClick} text={track.trackName} />
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
