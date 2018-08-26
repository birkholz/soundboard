import { Track, UNSET_KEYCODE } from "../types";

const getSoundFileAsDataURI = (soundFile: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function() {
      const array = new Uint8Array(this.result as ArrayBuffer);
      const base64String = btoa(
        array.reduce((data, byte) => {
          return data + String.fromCharCode(byte);
        }, "")
      );
      const finalString = `data:${soundFile.type};base64,${base64String}`;
      resolve(finalString);
    };
    reader.onerror = function() {
      reject(this.error);
    };
    reader.readAsArrayBuffer(soundFile);
  });

export const getTrackDataFromFile = async (soundFile: File): Promise<Track> => {
  const soundBinary = await getSoundFileAsDataURI(soundFile);
  return {
    id: `_${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    file: soundBinary,
    name: soundFile.name,
    keycode: UNSET_KEYCODE
  };
};
