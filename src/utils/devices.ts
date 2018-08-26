export const getDevices = (): Promise<{ [deviceId: string]: MediaDeviceInfo }> =>
  navigator.mediaDevices.enumerateDevices().then(devices =>
    devices.reduce((audioDeviceMap, audioDevice) => {
      if (audioDevice.kind === "audiooutput") {
        return {
          ...audioDeviceMap,
          [audioDevice.deviceId]: audioDevice
        };
      }
      return audioDeviceMap;
    }, {})
  );
