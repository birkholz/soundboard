import { keystrokeForKeyboardEvent } from './helpers';

// From https://github.com/atom/atom/blob/fa9c8d1aceb813af6a0100648bdd650f67be0c56/src/menu-helpers.js#L104
function acceleratorForKeystroke(keystroke: string) {
    if (!keystroke) {
        return null
    }
    let modifiers = keystroke.split(/-(?=.)/);

    let key = modifiers.pop() || '';
    key = key.toUpperCase().replace('+', 'Plus');

    modifiers = modifiers.map(modifier =>
        modifier
            .replace(/shift/gi, 'Shift')
            .replace(/cmd/gi, 'Command')
            .replace(/ctrl/gi, 'Ctrl')
            .replace(/alt/gi, 'Alt')
    )

    const keys = [...modifiers, key]
    return keys.join('+')
}

export function keyToAccelerator(event: KeyboardEvent) {
    const keystroke = keystrokeForKeyboardEvent(event);
    return acceleratorForKeystroke(keystroke);
}
