// @ts-ignore
import ElectronStore = require("electron-store");
export { ElectronStore };

export interface BaseTrack {
  id: string;
  name: string;
  keycode: number;
}

export interface Track extends BaseTrack {
  file: string;
}

export interface AudioElement extends HTMLAudioElement {
  setSinkId: (deviceId: string) => Promise<undefined>;
}

export type Outputs = [MediaDeviceInfo, MediaDeviceInfo];

export enum OutputNumber {
  One = 0,
  Two = 1
}

export interface IOHookKeydownEvent {
  keycode: number;
  rawcode: number;
  type: "keydown";
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}
