import * as fs from "fs";
import { AudioHTMLAttributes } from "react";

interface AudioElement extends HTMLAudioElement {
  setSinkId: (deviceId: string) => Promise<undefined>
}

declare var Audio: {
  new(src?: string): AudioElement;
};

function toArrayBuffer(buf: Buffer) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

type MaybeHTMLAudioElement = HTMLAudioElement | null

export enum OutputNumber {
  One = 0,
  Two = 1,
}
// @ts-ignore
interface DevicesMap {
  [deviceId: string]: MediaDeviceInfo
}

class Playback {
  ac: AudioContext
  dest: MediaStreamAudioDestinationNode;
  sources: AudioBufferSourceNode[];
  outputs: [MaybeHTMLAudioElement, MaybeHTMLAudioElement]

  constructor() {
    this.ac = new AudioContext();
    this.dest = this.ac.createMediaStreamDestination();
    this.sources = [];
    this.outputs = [null, null];
  }

  getDevices = async function() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audiooutput');
  }

  setOutput = async (device: MediaDeviceInfo, outputNumber: OutputNumber) => {
    const audio = new Audio();
    await audio.setSinkId(device.deviceId);
    audio.srcObject = this.dest.stream;
    this.outputs[outputNumber] = audio;
    audio.play();
  }

  // Some helper methods to control playback of our outputs
  play = (track: File) => {
    const source = this.ac.createBufferSource();
    this.sources.push(source);
    source.connect(this.dest);
    const buffer = toArrayBuffer(fs.readFileSync(track.path));
    this.ac.decodeAudioData(buffer, (audioBuffer) => {
      source.buffer = audioBuffer;
      source.start();
    });
  }

  stop = () => {
    this.sources.forEach(function(s){s.stop();});
    this.sources = [];
  }
}

export default Playback;
