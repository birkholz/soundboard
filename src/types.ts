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

export const ESCAPE_KEY = window.process.platform === "darwin" ? 1 : 27;
export const UNSET_KEYCODE = -1;
export const VALID_EXTENSIONS = ["mp3", "wav", "ogg"];
