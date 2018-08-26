import { Outputs } from "../types";

export interface OutputMap {
  [deviceId: string]: MediaDeviceInfo;
}

export const getDevices = (): Promise<OutputMap> =>
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

export const getOutputs = (devices: OutputMap, maybeOutputs: Outputs): Outputs => {
  const devicesList = Object.values(devices);
  let [output1, output2] = maybeOutputs;
  if (!devices[output1.deviceId]) {
    output1 = devices.default || devicesList[0];
  }
  if (!devices[output2.deviceId]) {
    output2 = Object.values(devices).find(({ label }) => label.includes("CABLE Input")) || devicesList[1];
  }
  return [output1, output2];
};
