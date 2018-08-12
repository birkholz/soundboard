import { Button, ControlGroup, InputGroup } from "@blueprintjs/core";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import { IpcRenderer } from "electron";
import { last } from "ramda";
import * as React from "react";
import { Component } from "react";
import { Devices } from "./components/Devices";
import FileInput from "./components/FileInput";
import { TrackList } from "./components/TrackList";
import { getTrackDataFromFile } from "./helpers";
import { keycodeNames } from "./keycodes";
import {
  getInitialAppState,
  removeTrackFromStores,
  updateBaseTrackInStateStore,
  updateOutputsInStore,
  updateStopKeyInStateStore,
  updateTracksInStores
} from "./store";
import {
  AudioElement,
  ESCAPE_KEY,
  IOHookKeydownEvent,
  OutputNumber,
  Outputs,
  Track,
  UNSET_KEYCODE,
  VALID_EXTENSIONS
} from "./types";

const electron = window.require("electron");

declare var Audio: {
  new (src?: string): AudioElement;
};

export interface AppState {
  appInitialized: boolean;
  tracks: Track[];
  filteredTracks: Track[];
  trackChanging: Track | null;
  devices: {
    [deviceId: string]: MediaDeviceInfo;
  };
  listeningForKey: boolean;
  outputs: Outputs;
  sources: AudioBufferSourceNode[];
  stopKey: number;
  dragging: number;
  loadingFiles: boolean;
}

const codeType = window.process.platform === "darwin" ? "keycode" : "rawcode";

class App extends Component<{}, AppState> {
  playingTracks: AudioElement[];
  filterInput: HTMLInputElement | null;

  constructor(props: {}) {
    super(props);
    this.playingTracks = [];
    this.filterInput = null;

    this.state = getInitialAppState({
      appInitialized: false,
      tracks: [],
      filteredTracks: [],
      trackChanging: null,
      devices: {},
      listeningForKey: false,
      outputs: [Object.create(MediaDeviceInfo), Object.create(MediaDeviceInfo)],
      sources: [],
      stopKey: UNSET_KEYCODE,
      dragging: 0,
      loadingFiles: false
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
          if (this.filterInput) {
            this.filterInput.blur();
          }
          this.playSound(track.file);
        }
      }
    });
    // Set listener to update device list if the devices available change
    navigator.mediaDevices.ondevicechange = () => {
      this.updateDevices().then(devices => this.setState({ devices }));
    };

    // Set up file drop events
    // state.dragging is a number because enter/leave fires on children also
    document.addEventListener(
      "dragenter",
      event => {
        event.preventDefault();
        event.stopPropagation();
        this.setState({ dragging: this.state.dragging + 1 });
      },
      false
    );
    document.addEventListener(
      "dragleave",
      event => {
        event.preventDefault();
        event.stopPropagation();
        this.setState({ dragging: this.state.dragging - 1 });
      },
      false
    );
    document.addEventListener("dragover", event => {
      event.preventDefault();
      event.stopPropagation();
    });
    document.addEventListener(
      "drop",
      event => {
        event.preventDefault();
        event.stopPropagation();
        this.setState({ dragging: 0, loadingFiles: true });
        const files = Array.from(event.dataTransfer.files);
        this.fileHandler(files);
      },
      false
    );

    document.addEventListener("keyup", event => {
      if (event.key === "s" && this.filterInput) {
        this.filterInput.focus();
      }
    });

    this.setState({ appInitialized: true });
  }

  processFiles = async (files: File[]) => {
    for (const file of files) {
      const track = await getTrackDataFromFile(file);
      const tracks = [...this.state.tracks, track];
      this.setState({ tracks, filteredTracks: tracks });
      updateTracksInStores(tracks);
    }
  };

  fileHandler = (files: File[]) => {
    const validAudioFiles = files.filter(file => {
      const extension = last(file.name.split(".")) || "";
      return VALID_EXTENSIONS.includes(extension);
    });
    this.processFiles(validAudioFiles).then(() => {
      this.setState({ loadingFiles: false });
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
      this.setState({ tracks, filteredTracks: tracks, trackChanging: null, listeningForKey: false });
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
    this.setState({ tracks, filteredTracks: tracks });
    removeTrackFromStores(tracks, track);
  };

  onDeviceSelect = (device: MediaDeviceInfo, outputNumber: OutputNumber) => {
    const outputs = this.state.outputs;
    outputs[outputNumber] = device;
    this.setState({ outputs });
    updateOutputsInStore(outputs);
  };

  filterTracks = (event: React.FormEvent) => {
    // @ts-ignore
    const inputValue = event.target.value;
    let filteredTracks = this.state.tracks;
    if (inputValue) {
      filteredTracks = filteredTracks.filter(track => track.name.includes(inputValue));
    }
    this.setState({ filteredTracks });
  };

  render() {
    const { stopKey, listeningForKey } = this.state;
    const { [stopKey]: stopText = "(unset)" } = keycodeNames;
    const setInput = (ele: HTMLInputElement) => (this.filterInput = ele);

    return (
      <div className="App">
        <div className="drag-target" style={{ display: this.state.dragging > 0 ? "block" : "none" }}>
          <div>Drop File(s) Here</div>
        </div>
        <div className="loading-files" style={{ display: this.state.loadingFiles ? "block" : "none" }}>
          <div>Loading...</div>
        </div>
        <TrackList
          tracks={this.state.filteredTracks}
          listeningForKey={this.state.listeningForKey}
          filtered={this.filterInput && this.filterInput.value !== ""}
          playSound={this.playSound}
          changeTrackKey={this.changeTrackKey}
          deleteTrack={this.deleteTrack}
        />
        <div className="management-bar-wrapper">
          <InputGroup
            onChange={this.filterTracks}
            leftIcon="search"
            placeholder="Filter..."
            large={true}
            inputRef={setInput}
          />
          <ControlGroup fill={true}>
            <FileInput onChange={this.fileHandler}>
              <Button className="upload-button" text="Add Sound" icon="plus" />
            </FileInput>
            <Button onClick={this.stopAllSounds} text="Stop" icon="stop" />
            <Button onClick={this.changeStopKey} text={stopText} disabled={listeningForKey} />
          </ControlGroup>
          <div className="management-bar-divider" />
          <ControlGroup className="devices" fill={true}>
            <Devices
              devices={Object.values(this.state.devices)}
              outputs={this.state.outputs}
              onItemSelect={this.onDeviceSelect}
            />
          </ControlGroup>
        </div>
      </div>
    );
  }
}

export default App;
