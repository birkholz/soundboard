import { getDevices } from "./devices";

describe("Devices", () => {
  describe("#getDevices", () => {
    Object.defineProperty(window, "navigator", {
      value: {
        mediaDevices: {
          enumerateDevices: () =>
            Promise.resolve([
              {
                deviceId: "default",
                groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d5",
                kind: "audiooutput",
                label: "Default"
              },
              {
                deviceId: "1",
                groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d6",
                kind: "audioinput",
                label: "Microphone"
              },
              {
                deviceId: "2",
                groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d7",
                kind: "audiooutput",
                label: "Speakers"
              }
            ])
        }
      },
      writable: true
    });

    it("returns a map of audio outputs uniquely keyed", async () => {
      const devices = await getDevices();
      expect(devices).toEqual({
        default: {
          deviceId: "default",
          groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d5",
          kind: "audiooutput",
          label: "Default"
        },
        2: {
          deviceId: "2",
          groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d7",
          kind: "audiooutput",
          label: "Speakers"
        }
      });
    });

    it("ignores non-output devices", async () => {
      const devices = await getDevices();
      expect(Object.keys(devices)).toHaveLength(2);
    });
  });
});
