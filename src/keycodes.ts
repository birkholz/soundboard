import { names } from "keycode";
// @ts-ignore
import { getKeymap } from "native-keymap";
const nativeKeymap = getKeymap();

export let keycodeNames = names;

if (process.platform === "darwin") {
  const macKeymaps = {
    "30": "KeyA",
    "48": "KeyB",
    "46": "KeyC",
    "32": "KeyD",
    "18": "KeyE",
    "33": "KeyF",
    "34": "KeyG",
    "35": "KeyH",
    "23": "KeyI",
    "36": "KeyJ",
    "37": "KeyK",
    "38": "KeyL",
    "50": "KeyM",
    "49": "KeyN",
    "24": "KeyO",
    "25": "KeyP",
    "16": "KeyQ",
    "19": "KeyR",
    "31": "KeyS",
    "20": "KeyT",
    "22": "KeyU",
    "47": "KeyV",
    "17": "KeyW",
    "45": "KeyX",
    "21": "KeyY",
    "44": "KeyZ",

    "2": "Digit1",
    "3": "Digit2",
    "4": "Digit3",
    "5": "Digit4",
    "6": "Digit5",
    "7": "Digit6",
    "8": "Digit7",
    "9": "Digit8",
    "10": "Digit9",
    "11": "Digit0",

    "28": "Enter",
    "1": "Escape",
    "14": "Backspace",
    "15": "Tab",
    "57": "Space",
    "12": "Minus",
    "13": "Equal",
    "26": "BracketLeft",
    "27": "BracketRight",
    "0": "IntlBackslash",
    "39": "Semicolon",
    "40": "Quote",
    "51": "Comma",
    "52": "Period",
    "53": "Slash",
    "58": "CapsLock",
    "43": "Backslash",
    "41": "Backquote",

    "29": "ControlLeft",
    "42": "ShiftLeft",
    "56": "AltLeft",
    "3675": "MetaLeft",

    "": "ControlRight",

    "54": "ShiftRight",
    "3640": "AltRight",
    "3676": "MetaRight"
  };
  const macKeycodeNames = {};
  for (const key in macKeymaps) {
    macKeycodeNames[Number(key)] = nativeKeymap[macKeymaps[key]].value;
  }
  keycodeNames = macKeycodeNames;
}
