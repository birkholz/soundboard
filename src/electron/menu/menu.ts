import { Menu } from "electron";
import { isLinux, isMac, isWindows } from "../lib/platform";
import { createLinuxMenu } from "./linux-menu";
import { createMacMenu } from "./macos-menu";
import { createWindowsMenu } from "./windows-menu";

/**
 * Attaches the menu to the appropriate place.
 *
 * @param window The main window.
 */
export function createMenu(window: Electron.BrowserWindow) {
  if (isMac()) {
    // on mac, the menu goes on the app
    const template = createMacMenu(window);
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } else if (isLinux()) {
    // on linux, the menu goes on the window
    const template = createLinuxMenu(window);
    const menu = Menu.buildFromTemplate(template);
    window.setMenu(menu);
  } else if (isWindows()) {
    // on windows, the menu goes on the window
    const template = createWindowsMenu(window);
    const menu = Menu.buildFromTemplate(template);
    window.setMenu(menu);
  }
}
