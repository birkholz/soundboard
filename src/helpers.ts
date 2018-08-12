export const getSoundFileAsDataURI = (soundFile: File): Promise<string> =>
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
