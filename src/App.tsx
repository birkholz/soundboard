import { Button } from "@blueprintjs/core";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import { IpcRenderer } from "electron";
import * as React from "react";
import { Component } from "react";
import { Devices } from "./components/Devices";
import FilePicker from "./components/FilePicker";
import { TrackList } from "./components/TrackList";
import { keycodeNames } from "./keycodes";

const electron = window.require("electron");

export interface Track {
  file: File;
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
  listeningForKey: boolean;
  outputs: Outputs;
  sources: AudioBufferSourceNode[];
  stopKey: number | null;
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
      listeningForKey: false,
      outputs: [Object.create(MediaDeviceInfo), Object.create(MediaDeviceInfo)],
      sources: [],
      stopKey: null
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
    electron.ipcRenderer.on("keydown", (_: IpcRenderer, message: IOHookKeydownEvent) => {
      const { trackChanging, listeningForKey, stopKey, tracks } = this.state;
      if (listeningForKey || trackChanging) {
        trackChanging ? this.setTrackKey(message) : this.setStopKey(message);
      } else {
        if (stopKey === message[codeType]) {
          this.stopAllSounds();
          return;
        }
        const track = tracks.find((t: Track) => t.keycode === message[codeType]);
        if (track) {
          this.playSound(track.file);
        }
      }
    });
    // Set listener to update device list if the devices available change
    navigator.mediaDevices.ondevicechange = () => {
      this.updateDevices().then(devices => this.setState({ devices }));
    };
  }

  changeFile = (file: File) => {
    const tracks = this.state.tracks;
    tracks.push({ file, keycode: null });
    this.setState({ tracks });
  };

  playSound = async (track: File) => {
    const [output1, output2] = this.state.outputs;
    const objUrl = URL.createObjectURL(track);
    const audio1 = new Audio(objUrl);
    const audio2 = new Audio(objUrl);
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

  changeTrackKey = (track: Track) => {
    this.setState({ trackChanging: track, listeningForKey: true });
  };

  setTrackKey = (event: IOHookKeydownEvent) => {
    const { tracks, trackChanging, listeningForKey, stopKey } = this.state;
    const eventCode = event[codeType];
    // Don't allow the escape key or the stopKey to be used for a keybinding
    const newKey = eventCode === ESCAPE_KEY || eventCode === stopKey ? null : eventCode;
    if (trackChanging && listeningForKey) {
      tracks.forEach(track => {
        if (track === trackChanging) {
          track.keycode = newKey;
        }
      });
      this.setState({ tracks, trackChanging: null, listeningForKey: false });
    }
  };

  changeStopKey = () => {
    this.setState({ listeningForKey: true });
  };

  setStopKey = (event: IOHookKeydownEvent) => {
    const { listeningForKey } = this.state;
    if (listeningForKey) {
      const eventCode = event[codeType];
      const newKey = eventCode === ESCAPE_KEY ? null : eventCode;
      this.setState({ listeningForKey: false, stopKey: newKey });
    }
  };

  deleteTrack = (track: Track) => {
    const tracks = this.state.tracks.filter(t => t !== track);
    this.stopAllSounds();
    this.setState({ tracks });
  };

  onDeviceSelect = (device: MediaDeviceInfo, outputNumber: OutputNumber) => {
    const outputs = this.state.outputs;
    outputs[outputNumber] = device;
    this.setState({ outputs });
  };

  renderStop = () => {
    const { stopKey, listeningForKey } = this.state;
    const stopIcon = !this.state.stopKey ? "insert" : undefined;
    const stopText = keycodeNames[stopKey || -1] || "";
    return (
      <div>
        <Button onClick={this.stopAllSounds} text="Stop" />
        <Button onClick={this.changeStopKey} text={stopText} icon={stopIcon} disabled={listeningForKey} />
      </div>
    );
  };

  render() {
    return (
      <div className="App">
        <Devices devices={this.state.devices} outputs={this.state.outputs} onItemSelect={this.onDeviceSelect} />
        <FilePicker extensions={["wav", "mp3", "ogg"]} onChange={this.changeFile} onError={this.logFileError}>
          <Button text="Add Sound" />
        </FilePicker>
        {this.renderStop()}
        <TrackList
          tracks={this.state.tracks}
          trackChanging={this.state.trackChanging}
          listeningForKey={this.state.listeningForKey}
          playSound={this.playSound}
          changeTrackKey={this.changeTrackKey}
          deleteTrack={this.deleteTrack}
        />
      </div>
    );
  }
}

export default App;
