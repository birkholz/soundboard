import { Button } from "@blueprintjs/core";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import { IpcRenderer } from "electron";
import { Component } from "react";
import * as React from "react";
import { Devices } from "./components/Devices";
import FilePicker from "./components/FilePicker";

import { TrackList } from "./components/TrackList";
import { getSoundFileAsDataURI } from "./helpers";
import { keycodeNames } from "./keycodes";
import {
  getInitialAppState,
  removeTrackFromStores,
  updateBaseTrackInStateStore,
  updateOutputsInStore,
  updateStopKeyInStateStore,
  updateTracksInStores
} from "./store";
import { AudioElement, IOHookKeydownEvent, OutputNumber, Outputs, Track } from "./types";
const electron = window.require("electron");

declare var Audio: {
  new (src?: string): AudioElement;
};

export interface AppState {
  appInitialized: boolean;
  tracks: Track[];
  trackChanging: Track | null;
  devices: {
    [deviceId: string]: MediaDeviceInfo;
  };
  listeningForKey: boolean;
  outputs: Outputs;
  sources: AudioBufferSourceNode[];
  stopKey: number;
}

const codeType = window.process.platform === "darwin" ? "keycode" : "rawcode";
const ESCAPE_KEY = window.process.platform === "darwin" ? 1 : 27;
const UNSET_KEYCODE = -1;

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
      listeningForKey: false,
      outputs: [Object.create(MediaDeviceInfo), Object.create(MediaDeviceInfo)],
      sources: [],
      stopKey: UNSET_KEYCODE
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
          name: file.name,
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

  changeTrackKey = (track: Track) => {
    this.setState({ trackChanging: track, listeningForKey: true });
  };

  setTrackKey = (event: IOHookKeydownEvent) => {
    const { tracks, trackChanging, listeningForKey, stopKey } = this.state;
    const eventCode = event[codeType];
    // Don't allow the escape key or the stopKey to be used for a keybinding
    const newKey = eventCode === ESCAPE_KEY || eventCode === stopKey ? -1 : eventCode;
    if (trackChanging && listeningForKey) {
      tracks.forEach(track => {
        if (track === trackChanging) {
          track.keycode = newKey;
        }
      });
      this.setState({ tracks, trackChanging: null, listeningForKey: false });
      updateBaseTrackInStateStore(tracks);
    }
  };

  changeStopKey = () => {
    this.setState({ listeningForKey: true });
  };

  setStopKey = (event: IOHookKeydownEvent) => {
    const { listeningForKey } = this.state;
    if (listeningForKey) {
      const eventCode = event[codeType];
      const newKey = eventCode === ESCAPE_KEY ? UNSET_KEYCODE : eventCode;
      this.setState({ listeningForKey: false, stopKey: newKey });
      updateStopKeyInStateStore(newKey);
    }
  };

  deleteTrack = (track: Track) => {
    const tracks = this.state.tracks.filter(t => t !== track);
    this.stopAllSounds();
    this.setState({ tracks });
    removeTrackFromStores(tracks, track);
  };

  onDeviceSelect = (device: MediaDeviceInfo, outputNumber: OutputNumber) => {
    const outputs = this.state.outputs;
    outputs[outputNumber] = device;
    this.setState({ outputs });
    updateOutputsInStore(outputs);
  };

  renderStop = () => {
    const { stopKey, listeningForKey } = this.state;
    const stopIcon = stopKey === UNSET_KEYCODE ? "insert" : undefined;
    const { [stopKey]: stopText = "" } = keycodeNames;
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
        <Devices
          devices={Object.values(this.state.devices)}
          outputs={this.state.outputs}
          onItemSelect={this.onDeviceSelect}
        />
        <FilePicker extensions={["wav", "mp3", "ogg"]} onChange={this.onTrackReceived} onError={this.logFileError}>
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
