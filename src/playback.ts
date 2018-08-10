const fs = window.require('fs');

declare global
{
  interface Window {
    require: any;
  }
} 

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

export enum OutputNumber {
  One = 0,
  Two = 1,
}

class Playback {
  ac: AudioContext;
  dest: MediaStreamAudioDestinationNode;
  sources: AudioBufferSourceNode[];

  constructor() {
    this.ac = new AudioContext();
    this.dest = this.ac.createMediaStreamDestination();
    this.sources = [];
  }

  getDevices = async function() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audiooutput');
  }

  setOutput = async (device: MediaDeviceInfo) => {
    const audio = new Audio();
    await audio.setSinkId(device.deviceId);
    audio.srcObject = this.dest.stream;
    audio.play();
    return audio;
  }

  // Some helper methods to control playback
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
