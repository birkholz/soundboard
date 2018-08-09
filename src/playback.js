const fs = window.require('fs');

function toArrayBuffer(buf) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

class Playback {
  constructor() {
    this.ac = new AudioContext();
    this.dest = this.ac.createMediaStreamDestination();
    this.sources = [];
    this.outputs = [];
    this.device1 = null;
    this.device2 = null;
  }

  getDevices = async function() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audiooutput');
  }

  setOutputs = async function(device1, device2) {
    this.device1 = device1;
    this.device2 = device2;

    // We create 2 audio nodes which will have distinct output devices
    const audio = new Audio();
    const audio2 = new Audio();
    // Set the sinkId of each audio to our different output devices (0 was my default, and 2 was my virtual cable input)
    await audio.setSinkId(this.device1.deviceId);
    await audio2.setSinkId(this.device2.deviceId);
    // Set the srcObject of both to use the same stream destination
    audio.srcObject = this.dest.stream;
    audio2.srcObject = this.dest.stream;

    this.outputs = [audio, audio2];
  };

  // Some helper methods to control playback of our outputs
  play = (track) => {
    const source = this.ac.createBufferSource();
    this.sources.push(source);
    source.connect(this.dest);
    let buffer = fs.readFileSync(track.path);
    buffer = toArrayBuffer(buffer);
    this.outputs.forEach(function(o){o.play();});
    this.ac.decodeAudioData(buffer, (abuffer) => {
      source.buffer = abuffer;
      source.start();
    });
  }

  stop = () => {
    this.outputs.forEach(function(o){o.pause();});
    this.sources.forEach(function(s){s.stop();});
  }
}

export default Playback;
