import { Button } from "@blueprintjs/core";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import * as React from "react";
import { Component } from "react";
import { Devices } from "./components/Devices";
import FilePicker from "./components/FilePicker";

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
  newKeybinding: string;
  devices: MediaDeviceInfo[];
  outputs: Outputs;
  sources: AudioBufferSourceNode[];
}

export enum OutputNumber {
  One = 0,
  Two = 1
}

type MaybeKey = string | null;

class App extends Component<{}, AppState> {
  listener: EventListenerOrEventListenerObject;
  playingTracks: AudioElement[];

  constructor(props: {}) {
    super(props);
    this.playingTracks = [];

    this.state = {
      tracks: [],
      trackChanging: null,
      newKeybinding: '',
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

  keyToAccelerator = (event: KeyboardEvent) => {
    const key = event.key;
    const code = event.keyCode;

    if ((code >= 65 && code <= 90) || (97 <= code && code <= 122)) {
      // Is latin character
      return key.toUpperCase();
    }
    else if (code >= 48 && code <= 57) {
      // Is number
      return key;
    }
    return null;
  };

  updateTrackKey = (key: MaybeKey) => {
    const { tracks, trackChanging } = this.state;
    if (trackChanging) {
      const trackIndex = tracks.indexOf(trackChanging);
      if (key) {
        globalShortcut.register(key, () => {
          this.playSound(trackChanging.file);
        });
      }
      else if (trackChanging.key && globalShortcut.isRegistered(trackChanging.key)) {
        globalShortcut.unregister(trackChanging.key);
      }
      trackChanging.key = key;
      tracks[trackIndex] = trackChanging;
    }
    this.setState({ tracks, trackChanging: null, newKeybinding: '' });
    document.removeEventListener("keydown", this.finishKey);
  }

  finishKey = (event: KeyboardEvent) => {
    let soFar = this.state.newKeybinding;
    if (['Shift', 'Ctrl', 'Cmd'].includes(event.key)) {
      if (soFar) {
        soFar += '+';
      }
      soFar += event.key;
      this.setState({newKeybinding: soFar});
    }
    else {
      let newKey = this.state.newKeybinding;
      if (newKey) {
        newKey += '+';
      }
      const accelerator = this.keyToAccelerator(event);
      if (accelerator){
        newKey += accelerator;
        this.updateTrackKey(newKey);
      }
      else {
        this.updateTrackKey(null);
      }

    }
  };

  deleteTrack = (track: Track) => {
    if (track.key && globalShortcut.isRegistered(track.key)) {
      globalShortcut.unregister(track.key);
    }
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
