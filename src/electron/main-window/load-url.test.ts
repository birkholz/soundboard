import { loadURL } from "./load-url";

test("loads from electron", () => {
  const loadStub = jest.fn();
  loadURL({ loadURL: loadStub } as any, "a");
  if (process.platform === "win32") {
    expect(loadStub).toBeCalledWith("file:///a\\out\\index.html");
  } else {
    expect(loadStub).toBeCalledWith("file:///a/out/index.html");
  }
});
