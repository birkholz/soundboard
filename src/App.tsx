import { Button } from "@blueprintjs/core";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import { IpcRenderer } from "electron";
import { Component } from "react";
import * as React from "react";
import { Devices } from "./components/Devices";
import FilePicker from "./components/FilePicker";
import { getSoundFileAsDataURI } from "./helpers";
import { keycodeNames } from "./keycodes";
import {
  getInitialAppState,
  removeTrackFromStores,
  updateBaseTrackInStateStore,
  updateOutputsInStore,
  updateTracksInStores
} from "./store";
import { AudioElement, IOHookKeydownEvent, OutputNumber, Outputs, Track } from "./types";

const electron = window.require("electron");

declare var Audio: {
  new (src?: string): AudioElement;
};

const codeType = window.process.platform === "darwin" ? "keycode" : "rawcode";
const ESCAPE_KEY = window.process.platform === "darwin" ? 1 : 27;
const UNSET_KEYCODE = -1;

export interface AppState {
  appInitialized: boolean;
  tracks: Track[];
  trackChanging: Track | null;
  devices: {
    [deviceId: string]: MediaDeviceInfo;
  };
  outputs: Outputs;
  sources: AudioBufferSourceNode[];
}
class App extends Component<{}, AppState> {
  playingTracks: AudioElement[];

  constructor(props: {}) {
    super(props);
    this.playingTracks = [];

    this.state = getInitialAppState({
      appInitialized: false,
      tracks: [],
      trackChanging: null,
      devices: {},
      outputs: [Object.create(MediaDeviceInfo), Object.create(MediaDeviceInfo)],
      sources: []
    });
  }

  updateDevices = async (): Promise<{ [deviceId: string]: MediaDeviceInfo }> => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(device => device.kind === "audiooutput");
    return audioDevices.reduce((audioDeviceMap, audioDevice) => {
      return {
        ...audioDeviceMap,
        [audioDevice.deviceId]: audioDevice
      };
    }, {});
  };

  initializeDevicesAndOutputs = async () => {
    this.updateDevices().then(devices => {
      const [defaultDevice, backupDevice] = Object.values(devices);
      const { outputs } = this.state;
      let [output1, output2] = outputs;
      if (!devices[output1.deviceId]) {
        output1 = defaultDevice;
      }
      if (!devices[output2.deviceId]) {
        // Attempt to default to VB CABLE Input
        output2 = Object.values(devices).find(({ label }) => label.includes("CABLE Input")) || backupDevice;
      }

      const updatedOutputs: Outputs = [output1, output2];
      this.setState({
        devices,
        outputs: updatedOutputs
      });
      updateOutputsInStore(updatedOutputs);
    });
  };

  componentDidMount() {
    // Set initial outputs
    this.initializeDevicesAndOutputs();

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

    this.setState({ appInitialized: true });
  }

  onTrackReceived = (file: File) => {
    getSoundFileAsDataURI(file).then((soundBinary: string) => {
      const tracks = [
        ...this.state.tracks,
        {
          id: `_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          file: soundBinary,
          trackName: file.name,
          keycode: UNSET_KEYCODE
        }
      ];
      this.setState({ tracks });
      updateTracksInStores(tracks);
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
    const newKey = eventCode === ESCAPE_KEY ? UNSET_KEYCODE : eventCode;
    if (trackChanging) {
      tracks.forEach(track => {
        if (track === trackChanging) {
          track.keycode = newKey;
        }
      });
      this.setState({ tracks, trackChanging: null });
      updateBaseTrackInStateStore(tracks);
    }
  };

  deleteTrack = (track: Track) => {
    const tracks = this.state.tracks.filter(t => t !== track);
    this.stopAllSounds();
    this.setState({ tracks });
    removeTrackFromStores(tracks, track);
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
    const canHaveKeyAssigned = track.keycode === -1 && !trackChanging;
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
    updateOutputsInStore(outputs);
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
        <Devices
          devices={Object.values(this.state.devices)}
          outputs={this.state.outputs}
          onItemSelect={this.onDeviceSelect}
        />
        <FilePicker extensions={["wav", "mp3", "ogg"]} onChange={this.onTrackReceived} onError={this.logFileError}>
          <Button text="Add Sound" />
        </FilePicker>
        <Button onClick={this.stopAllSounds} text="Stop" />
        {this.renderTable(this.state.tracks)}
      </div>
    );
  }
}

export default App;
