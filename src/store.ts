import { dissoc, map, propEq, reject } from "ramda";
import { AppState } from "./App";
import { BaseTrack, ElectronStore, Outputs, Track } from "./types";

const Store: typeof ElectronStore = window.require("electron-store");
const isStoreNotEmpty = (store: ElectronStore) => store.size !== 0;

interface TrackStore {
  [trackId: string]: string;
}

interface StateStore {
  outputs: Outputs;
  tracks: BaseTrack[];
  stopKey: number;
}

const trackStore: ElectronStore<TrackStore> = new Store({
  name: "tracks"
});
const stateStore: ElectronStore<StateStore> = new Store({
  name: "state"
});

export const updateOutputsInStore = (outputs: Outputs) => {
  stateStore.set("outputs", outputs);
};

export const updateStopKeyInStateStore = (stopKey: number) => {
  stateStore.set("stopKey", stopKey);
};

const updateTracksInTrackStore = (tracks: Track[]) => {
  const tracksToAdd = tracks.reduce<TrackStore>((trackMap, { id, file }) => {
    if (!trackStore.has(id)) {
      trackMap[id] = file;
    }

    return trackMap;
  }, {});
  trackStore.set(tracksToAdd);
};

export const updateBaseTrackInStateStore = (tracks: Track[]) => {
  stateStore.set("tracks", map(dissoc("file"), tracks));
};

export const updateTracksInStores = (tracks: Track[]) => {
  updateTracksInTrackStore(tracks);
  updateBaseTrackInStateStore(tracks);
};

export const removeTrackFromStores = (tracks: Track[], tracktoDelete: Track) => {
  trackStore.delete(tracktoDelete.id);
  stateStore.set("tracks", reject<BaseTrack>(propEq("id", tracktoDelete.id), tracks));
};

export const getTracks = (baseTracks: BaseTrack[]) => {
  return baseTracks.map<Track>(baseTrack => ({
    ...baseTrack,
    file: trackStore.get(baseTrack.id)
  }));
};

export const getInitialAppState = (defaultState: AppState): AppState => {
  let updatedState: AppState = {
    ...defaultState
  };
  if (isStoreNotEmpty(stateStore)) {
    const { outputs, stopKey } = defaultState;
    updatedState = {
      ...updatedState,
      outputs: stateStore.get("outputs", outputs),
      stopKey: stateStore.get("stopKey", stopKey)
    };

    if (isStoreNotEmpty(trackStore)) {
      updatedState = {
        ...updatedState,
        tracks: getTracks(stateStore.get("tracks"))
      };
    }
  }
  return updatedState;
};
