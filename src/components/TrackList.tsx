import { Button } from "@blueprintjs/core";
import * as React from "react";
import { ReactNode, SFC } from "react";
import { keycodeNames } from "../keycodes";
import { Track } from "../types";

export interface TrackListProps {
  tracks: Track[];
  listeningForKey: boolean;
  playSound: (file: string) => Promise<void>;
  changeTrackKey: (track: Track) => void;
  deleteTrack: (track: Track) => void;
}

const getKeyText = (track: Track) => {
  if (track.keycode) {
    return keycodeNames[track.keycode];
  } else {
    return "";
  }
};

export const TrackList: SFC<TrackListProps> = ({
  tracks,
  listeningForKey,
  playSound,
  changeTrackKey,
  deleteTrack
}: TrackListProps) => {
  const trackFilter = document.querySelector(".track-filter");
  // @ts-ignore
  const filtered = trackFilter && trackFilter.value !== "";
  if (filtered && !tracks.length) {
    return (
      <div className="empty-text">
        <p>No matching sounds.</p>
      </div>
    );
  } else if (!tracks.length) {
    return (
      <div className="empty-text">
        <p>Add sounds by clicking "Add Sound" below, or dragging files into the window.</p>
        <p>Supported file types: .mp3, .wav, .ogg</p>
      </div>
    );
  }

  const trackRows: ReactNode[] = tracks.map((track, index) => {
    const canHaveKeyAssigned = track.keycode === -1 && !listeningForKey;
    const icon = canHaveKeyAssigned ? "insert" : undefined;

    const onPlayClick = () => playSound(track.file);
    const onChangeTrackKeyClick = () => changeTrackKey(track);
    const onDeleteTrackClick = () => deleteTrack(track);
    return (
      <tr key={index}>
        <td>
          <Button onClick={onPlayClick} text={track.name} />
        </td>
        <td>
          <Button onClick={onChangeTrackKeyClick} disabled={listeningForKey} icon={icon} text={getKeyText(track)} />
        </td>
        <td>
          <Button onClick={onDeleteTrackClick} disabled={listeningForKey} icon="trash" />
        </td>
      </tr>
    );
  });

  return (
    <table className="bp3-html-table bp3-html-table-striped">
      <thead />
      <tbody>{trackRows}</tbody>
    </table>
  );
};
