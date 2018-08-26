import { dissoc } from "ramda";
import { Outputs } from "../types";
import { getDevices, getOutputs, OutputMap } from "./devices";

const MOCK_INPUT_DEVICES = [
  {
    deviceId: "1",
    groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d6",
    kind: "audioinput",
    label: "Microphone"
  }
];

const MOCK_OUTPUT_DEVICES = [
  {
    deviceId: "default",
    groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d5",
    kind: "audiooutput",
    label: "Default"
  },
  {
    deviceId: "2",
    groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d7",
    kind: "audiooutput",
    label: "Speakers"
  },
  {
    deviceId: "3",
    groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d8",
    kind: "audiooutput",
    label: "CABLE Input (VB-Audio Virtual Cable)"
  }
];

const MOCK_DEVICES_MAP: OutputMap = {
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
  },
  3: {
    deviceId: "3",
    groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d8",
    kind: "audiooutput",
    label: "CABLE Input (VB-Audio Virtual Cable)"
  }
};

describe("Devices", () => {
  describe("#getDevices", () => {
    Object.defineProperty(window, "navigator", {
      value: {
        mediaDevices: {
          enumerateDevices: () => Promise.resolve([...MOCK_INPUT_DEVICES, ...MOCK_OUTPUT_DEVICES])
        }
      },
      writable: true
    });

    it("returns a map of audio outputs uniquely keyed", async () => {
      const devices = await getDevices();
      expect(devices).toEqual(MOCK_DEVICES_MAP);
    });

    it("ignores non-output devices", async () => {
      const devices = await getDevices();
      expect(Object.keys(devices)).toHaveLength(3);
    });
  });

  describe("#getOutputs", () => {
    describe("provided outputs array empty", () => {
      it("defaults unset outputs", () => {
        expect(getOutputs(MOCK_DEVICES_MAP, [{}, {}] as Outputs)).toHaveLength(2);
      });

      describe("default input exists", () => {
        it("defaults first output to OS default", () => {
          const outputs = getOutputs(MOCK_DEVICES_MAP, [{}, {}] as Outputs);
          expect(outputs[0]).toEqual({
            deviceId: "default",
            groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d5",
            kind: "audiooutput",
            label: "Default"
          });
        });
      });

      describe("default input does not exist", () => {
        it("uses first device found in values", async () => {
          const mockDevicesMapWithoutVirtualInput = dissoc<OutputMap>("default", MOCK_DEVICES_MAP);
          const outputs = getOutputs(mockDevicesMapWithoutVirtualInput, [{}, {}] as Outputs);
          expect(outputs).not.toEqual({
            deviceId: "default",
            groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d5",
            kind: "audiooutput",
            label: "Default"
          });
        });
      });

      describe("virtual cable input exists", () => {
        it("defaults second output to virtual cable input", () => {
          const outputs = getOutputs(MOCK_DEVICES_MAP, [{}, {}] as Outputs);
          expect(outputs[1]).toEqual({
            deviceId: "3",
            groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d8",
            kind: "audiooutput",
            label: "CABLE Input (VB-Audio Virtual Cable)"
          });
        });
      });

      describe("virtual cable input does not exist", () => {
        it("uses second device found in values", async () => {
          const mockDevicesMapWithoutVirtualInput = dissoc<OutputMap>("3", MOCK_DEVICES_MAP);
          const outputs = getOutputs(mockDevicesMapWithoutVirtualInput, [{}, {}] as Outputs);
          expect(outputs[1]).not.toEqual({
            deviceId: "3",
            groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d8",
            kind: "audiooutput",
            label: "CABLE Input (VB-Audio Virtual Cable)"
          });
        });
      });
    });
    describe("provided outputs array exists", () => {
      it("returns first two outputs", () => {
        const providedOutputs: Outputs = [
          {
            deviceId: "default",
            groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d5",
            kind: "audiooutput",
            label: "Default"
          },
          {
            deviceId: "2",
            groupId: "7bc7b09937a833e3dceb1bdc12d60a2ae308960a84f6c755162b3f00a30828d7",
            kind: "audiooutput",
            label: "Speakers"
          }
        ];
        expect(getOutputs(MOCK_DEVICES_MAP, providedOutputs)).toEqual(providedOutputs);
      });
    });
  });
});
