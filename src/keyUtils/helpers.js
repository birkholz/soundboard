
var ENDS_IN_MODIFIER_REGEX, KEY_NAMES_BY_KEYBOARD_EVENT_CODE, KeyboardLayout, LATIN_KEYMAP_CACHE, MODIFIERS, NON_CHARACTER_KEY_NAMES_BY_KEYBOARD_EVENT_KEY, NUMPAD_KEY_NAMES_BY_KEYBOARD_EVENT_CODE, WHITESPACE_REGEX, buildKeyboardEvent, isASCIICharacter, isKeyup, isLatinCharacter, isLatinKeymap, isLowerCaseCharacter, isUpperCaseCharacter, nonAltModifiedKeyForKeyboardEvent, normalizeKeystroke, parseKeystroke, slovakCmdCharactersForKeyCode, slovakCmdKeymap, slovakQwertyCmdKeymap, usCharactersForKeyCode, usKeymap;

KeyboardLayout = require('keyboard-layout');

MODIFIERS = new Set(['ctrl', 'alt', 'shift', 'cmd']);

ENDS_IN_MODIFIER_REGEX = /(ctrl|alt|shift|cmd)$/;

WHITESPACE_REGEX = /\s+/;

KEY_NAMES_BY_KEYBOARD_EVENT_CODE = {
    'Space': 'space',
    'Backspace': 'backspace'
};

NON_CHARACTER_KEY_NAMES_BY_KEYBOARD_EVENT_KEY = {
    'Control': 'ctrl',
    'Meta': 'cmd',
    'ArrowDown': 'down',
    'ArrowUp': 'up',
    'ArrowLeft': 'left',
    'ArrowRight': 'right'
};

NUMPAD_KEY_NAMES_BY_KEYBOARD_EVENT_CODE = {
    'Numpad0': 'numpad0',
    'Numpad1': 'numpad1',
    'Numpad2': 'numpad2',
    'Numpad3': 'numpad3',
    'Numpad4': 'numpad4',
    'Numpad5': 'numpad5',
    'Numpad6': 'numpad6',
    'Numpad7': 'numpad7',
    'Numpad8': 'numpad8',
    'Numpad9': 'numpad9'
};

LATIN_KEYMAP_CACHE = new WeakMap();

isLatinKeymap = function(keymap) {
    var isLatin;
    if (keymap == null) {
    return true;
    }
    isLatin = LATIN_KEYMAP_CACHE.get(keymap);
    if (isLatin != null) {
    return isLatin;
    } else {
    isLatin = ((keymap.KeyA == null) || isLatinCharacter(keymap.KeyA.unmodified)) && ((keymap.KeyS == null) || isLatinCharacter(keymap.KeyS.unmodified)) && ((keymap.KeyD == null) || isLatinCharacter(keymap.KeyD.unmodified)) && ((keymap.KeyF == null) || isLatinCharacter(keymap.KeyF.unmodified));
    LATIN_KEYMAP_CACHE.set(keymap, isLatin);
    return isLatin;
    }
};

isASCIICharacter = function(character) {
    return (character != null) && character.length === 1 && character.charCodeAt(0) <= 127;
};

isLatinCharacter = function(character) {
    return (character != null) && character.length === 1 && character.charCodeAt(0) <= 0x024F;
};

isUpperCaseCharacter = function(character) {
    return (character != null) && character.length === 1 && character.toLowerCase() !== character;
};

isLowerCaseCharacter = function(character) {
    return (character != null) && character.length === 1 && character.toUpperCase() !== character;
};

usKeymap = null;

usCharactersForKeyCode = function(code) {
    if (usKeymap == null) {
    usKeymap = require('./us-keymap');
    }
    return usKeymap[code];
};

slovakCmdKeymap = null;

slovakQwertyCmdKeymap = null;

slovakCmdCharactersForKeyCode = function(code, layout) {
    if (slovakCmdKeymap == null) {
    slovakCmdKeymap = require('./slovak-cmd-keymap');
    }
    if (slovakQwertyCmdKeymap == null) {
    slovakQwertyCmdKeymap = require('./slovak-qwerty-cmd-keymap');
    }
    if (layout === 'com.apple.keylayout.Slovak') {
    return slovakCmdKeymap[code];
    } else {
    return slovakQwertyCmdKeymap[code];
    }
};

exports.normalizeKeystrokes = function(keystrokes) {
    var keystroke, normalizedKeystroke, normalizedKeystrokes, _i, _len, _ref;
    normalizedKeystrokes = [];
    _ref = keystrokes.split(WHITESPACE_REGEX);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    keystroke = _ref[_i];
    if (normalizedKeystroke = normalizeKeystroke(keystroke)) {
        normalizedKeystrokes.push(normalizedKeystroke);
    } else {
        return false;
    }
    }
    return normalizedKeystrokes.join(' ');
};

normalizeKeystroke = function(keystroke) {
    var i, key, keys, keyup, modifiers, primaryKey, _i, _len;
    if (keyup = isKeyup(keystroke)) {
    keystroke = keystroke.slice(1);
    }
    keys = parseKeystroke(keystroke);
    if (!keys) {
    return false;
    }
    primaryKey = null;
    modifiers = new Set;
    for (i = _i = 0, _len = keys.length; _i < _len; i = ++_i) {
    key = keys[i];
    if (MODIFIERS.has(key)) {
        modifiers.add(key);
    } else {
        if (i === keys.length - 1) {
        primaryKey = key;
        } else {
        return false;
        }
    }
    }
    if (keyup) {
    if (primaryKey != null) {
        primaryKey = primaryKey.toLowerCase();
    }
    } else {
    if (isUpperCaseCharacter(primaryKey)) {
        modifiers.add('shift');
    }
    if (modifiers.has('shift') && isLowerCaseCharacter(primaryKey)) {
        primaryKey = primaryKey.toUpperCase();
    }
    }
    keystroke = [];
    if (!keyup || (keyup && (primaryKey == null))) {
    if (modifiers.has('ctrl')) {
        keystroke.push('ctrl');
    }
    if (modifiers.has('alt')) {
        keystroke.push('alt');
    }
    if (modifiers.has('shift')) {
        keystroke.push('shift');
    }
    if (modifiers.has('cmd')) {
        keystroke.push('cmd');
    }
    }
    if (primaryKey != null) {
    keystroke.push(primaryKey);
    }
    keystroke = keystroke.join('-');
    if (keyup) {
    keystroke = "^" + keystroke;
    }
    return keystroke;
};

parseKeystroke = function(keystroke) {
    var character, index, keyStart, keys, _i, _len;
    keys = [];
    keyStart = 0;
    for (index = _i = 0, _len = keystroke.length; _i < _len; index = ++_i) {
    character = keystroke[index];
    if (character === '-') {
        if (index > keyStart) {
        keys.push(keystroke.substring(keyStart, index));
        keyStart = index + 1;
        if (keyStart === keystroke.length) {
            return false;
        }
        }
    }
    }
    if (keyStart < keystroke.length) {
    keys.push(keystroke.substring(keyStart));
    }
    return keys;
};

exports.keystrokeForKeyboardEvent = function(event, customKeystrokeResolvers) {
    var altKey, characters, code, ctrlKey, currentLayout, customKeystroke, isNonCharacterKey, key, keystroke, metaKey, nonAltModifiedKey, resolver, shiftKey, _i, _len, _ref, _ref1;
    key = event.key, code = event.code, ctrlKey = event.ctrlKey, altKey = event.altKey, shiftKey = event.shiftKey, metaKey = event.metaKey;
    currentLayout = KeyboardLayout.getCurrentKeyboardLayout();
    if (key === 'Dead') {
    if (process.platform === 'darwin' && (characters = (_ref = KeyboardLayout.getCurrentKeymap()) != null ? _ref[event.code] : void 0)) {
        if (altKey && shiftKey && (characters.withAltGraphShift != null)) {
        key = characters.withAltGraphShift;
        } else if (altKey && (characters.withAltGraph != null)) {
        key = characters.withAltGraph;
        } else if (shiftKey && (characters.withShift != null)) {
        key = characters.withShift;
        } else if (characters.unmodified != null) {
        key = characters.unmodified;
        }
    }
    }
    if ((NUMPAD_KEY_NAMES_BY_KEYBOARD_EVENT_CODE[code] != null) && event.getModifierState('NumLock')) {
    key = NUMPAD_KEY_NAMES_BY_KEYBOARD_EVENT_CODE[code];
    }
    if (KEY_NAMES_BY_KEYBOARD_EVENT_CODE[code] != null) {
    key = KEY_NAMES_BY_KEYBOARD_EVENT_CODE[code];
    }
    if (process.platform === 'linux') {
    if (code === 'NumpadDecimal' && !event.getModifierState('NumLock')) {
        key = 'delete';
    }
    if (code === 'IntlRo' && key === 'Unidentified' && ctrlKey) {
        key = '/';
    }
    }
    isNonCharacterKey = key.length > 1;
    if (isNonCharacterKey) {
    key = (_ref1 = NON_CHARACTER_KEY_NAMES_BY_KEYBOARD_EVENT_KEY[key]) != null ? _ref1 : key.toLowerCase();
    if (key === "altgraph" && process.platform === "win32") {
        key = "alt";
    }
    } else {
    if (shiftKey) {
        key = key.toUpperCase();
    } else {
        key = key.toLowerCase();
    }
    if (event.getModifierState('AltGraph') || (process.platform === 'darwin' && altKey)) {
        if (process.platform === 'darwin' && event.code) {
        nonAltModifiedKey = nonAltModifiedKeyForKeyboardEvent(event);
        if (nonAltModifiedKey && (ctrlKey || metaKey || !isASCIICharacter(key))) {
            key = nonAltModifiedKey;
        } else if (key !== nonAltModifiedKey) {
            altKey = false;
        }
        } else if (process.platform === 'win32' && event.code) {
        nonAltModifiedKey = nonAltModifiedKeyForKeyboardEvent(event);
        if (nonAltModifiedKey && (metaKey || !isASCIICharacter(key))) {
            key = nonAltModifiedKey;
        } else if (key !== nonAltModifiedKey) {
            ctrlKey = false;
            altKey = false;
        }
        } else if (process.platform === 'linux') {
        nonAltModifiedKey = nonAltModifiedKeyForKeyboardEvent(event);
        if (nonAltModifiedKey && (ctrlKey || altKey || metaKey)) {
            key = nonAltModifiedKey;
            altKey = event.getModifierState('AltGraph');
        }
        }
    }
    }
    if ((key.length === 1 && !isLatinKeymap(KeyboardLayout.getCurrentKeymap())) || (metaKey && currentLayout.indexOf('DVORAK-QWERTYCMD') > -1)) {
    if (characters = usCharactersForKeyCode(event.code)) {
        if (event.shiftKey) {
        key = characters.withShift;
        } else {
        key = characters.unmodified;
        }
    }
    }
    if (metaKey && currentLayout === 'com.apple.keylayout.Slovak' || currentLayout === 'com.apple.keylayout.Slovak-QWERTY') {
    if (characters = slovakCmdCharactersForKeyCode(event.code, currentLayout)) {
        if (event.shiftKey) {
        key = characters.withShift;
        } else {
        key = characters.unmodified;
        }
    }
    }
    keystroke = '';
    if (key === 'ctrl' || (ctrlKey && event.type !== 'keyup')) {
    keystroke += 'ctrl';
    }
    if (key === 'alt' || (altKey && event.type !== 'keyup')) {
    if (keystroke.length > 0) {
        keystroke += '-';
    }
    keystroke += 'alt';
    }
    if (key === 'shift' || (shiftKey && event.type !== 'keyup' && (isNonCharacterKey || (isLatinCharacter(key) && isUpperCaseCharacter(key))))) {
    if (keystroke) {
        keystroke += '-';
    }
    keystroke += 'shift';
    }
    if (key === 'cmd' || (metaKey && event.type !== 'keyup')) {
    if (keystroke) {
        keystroke += '-';
    }
    keystroke += 'cmd';
    }
    if (!MODIFIERS.has(key)) {
    if (keystroke) {
        keystroke += '-';
    }
    keystroke += key;
    }
    if (event.type === 'keyup') {
    keystroke = normalizeKeystroke("^" + keystroke);
    }
    if (customKeystrokeResolvers != null) {
    for (_i = 0, _len = customKeystrokeResolvers.length; _i < _len; _i++) {
        resolver = customKeystrokeResolvers[_i];
        customKeystroke = resolver({
        keystroke: keystroke,
        event: event,
        layoutName: KeyboardLayout.getCurrentKeyboardLayout(),
        keymap: KeyboardLayout.getCurrentKeymap()
        });
        if (customKeystroke) {
        keystroke = normalizeKeystroke(customKeystroke);
        }
    }
    }
    return keystroke;
};

nonAltModifiedKeyForKeyboardEvent = function(event) {
    var characters, _ref;
    if (event.code && (characters = (_ref = KeyboardLayout.getCurrentKeymap()) != null ? _ref[event.code] : void 0)) {
    if (event.shiftKey) {
        return characters.withShift;
    } else {
        return characters.unmodified;
    }
    }
};

exports.MODIFIERS = MODIFIERS;

exports.characterForKeyboardEvent = function(event) {
    if (event.key.length === 1 && !(event.ctrlKey || event.metaKey)) {
    return event.key;
    }
};

exports.isBareModifier = function(keystroke) {
    return ENDS_IN_MODIFIER_REGEX.test(keystroke);
};

exports.isModifierKeyup = function(keystroke) {
    return isKeyup(keystroke) && ENDS_IN_MODIFIER_REGEX.test(keystroke);
};

exports.isKeyup = isKeyup = function(keystroke) {
    return keystroke.startsWith('^') && keystroke !== '^';
};

exports.keydownEvent = function(key, options) {
    return buildKeyboardEvent(key, 'keydown', options);
};

exports.keyupEvent = function(key, options) {
    return buildKeyboardEvent(key, 'keyup', options);
};

exports.getModifierKeys = function(keystroke) {
    var key, keys, mod_keys, _i, _len;
    keys = keystroke.split('-');
    mod_keys = [];
    for (_i = 0, _len = keys.length; _i < _len; _i++) {
    key = keys[_i];
    if (MODIFIERS.has(key)) {
        mod_keys.push(key);
    }
    }
    return mod_keys;
};

buildKeyboardEvent = function(key, eventType, _arg) {
    var alt, altKey, bubbles, cancelable, cmd, ctrl, ctrlKey, event, keyCode, location, metaKey, shift, shiftKey, target, _ref;
    _ref = _arg != null ? _arg : {}, ctrl = _ref.ctrl, shift = _ref.shift, alt = _ref.alt, cmd = _ref.cmd, keyCode = _ref.keyCode, target = _ref.target, location = _ref.location;
    ctrlKey = ctrl != null ? ctrl : false;
    altKey = alt != null ? alt : false;
    shiftKey = shift != null ? shift : false;
    metaKey = cmd != null ? cmd : false;
    bubbles = true;
    cancelable = true;
    event = new KeyboardEvent(eventType, {
    key: key,
    ctrlKey: ctrlKey,
    altKey: altKey,
    shiftKey: shiftKey,
    metaKey: metaKey,
    bubbles: bubbles,
    cancelable: cancelable
    });
    if (target != null) {
    Object.defineProperty(event, 'target', {
        get: function() {
        return target;
        }
    });
    Object.defineProperty(event, 'path', {
        get: function() {
        return [target];
        }
    });
    }
    return event;
};
