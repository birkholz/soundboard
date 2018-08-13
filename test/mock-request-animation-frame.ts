/**
 * Poor man's polyfill for raf.
 */

/* tslint:disable */
// @ts-ignore
global.window = global;
window.addEventListener = () => {};
window.requestAnimationFrame = () => 1;
