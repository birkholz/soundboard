const fs = window.require("fs");

declare global {
  interface Window {
    require: any;
  }
}

export interface AudioElement extends HTMLAudioElement {
  setSinkId: (deviceId: string) => Promise<undefined>;
}

declare var Audio: {
  new (src?: string): AudioElement;
};

function toArrayBuffer(buf: Buffer) {
  var ab = new ArrayBuffer(buf.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}

export enum OutputNumber {
  One = 0,
  Two = 1
}

export interface Output {
  audioElement: AudioElement;
  device: MediaDeviceInfo;
  label: string;
}

class Playback {
  ac: AudioContext;
  dest: MediaStreamAudioDestinationNode;

  constructor() {
    this.ac = new AudioContext();
    this.dest = this.ac.createMediaStreamDestination();
  }

  getDevices = async function() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === "audiooutput");
  };

  setOutput = async (device: MediaDeviceInfo): Promise<Output> => {
    const { label } = device;
    const audioElement = new Audio();
    await audioElement.setSinkId(device.deviceId);
    audioElement.srcObject = this.dest.stream;
    audioElement.play();
    return { audioElement, device, label };
  };

  createTrackSource = async (track: File): Promise<AudioBufferSourceNode> => {
    const source = this.ac.createBufferSource();
    source.connect(this.dest);
    const buffer = toArrayBuffer(fs.readFileSync(track.path));
    source.buffer = await this.ac.decodeAudioData(buffer);

    return source;
  };
}

export default Playback;
