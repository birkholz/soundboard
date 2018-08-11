import { Button } from "@blueprintjs/core";
import * as React from "react";
import { ReactNode, SFC } from "react";
import { Track } from "../App";
import { keycodeNames } from "../keycodes";

export interface TrackListProps {
  tracks: Track[];
  trackChanging: Track | null;
  listeningForKey: boolean;
  playSound: (file: File) => void;
  changeTrackKey: (track: Track) => void;
  deleteTrack: (track: Track) => void;
}

const getKeyText = (track: Track, trackChanging: Track | null) => {
  if (track === trackChanging) {
    return "Press any key";
  } else if (!track.keycode) {
    return "";
  } else {
    return keycodeNames[track.keycode];
  }
};

export const TrackList: SFC<TrackListProps> = ({
  tracks,
  trackChanging,
  listeningForKey,
  playSound,
  changeTrackKey,
  deleteTrack
}: TrackListProps) => {
  if (!tracks.length) {
    return <div />;
  }
  const trackRows: ReactNode[] = [];
  tracks.forEach((track, index) => {
    const canHaveKeyAssigned = !track.keycode && !listeningForKey;
    const icon = canHaveKeyAssigned ? "insert" : undefined;

    const onPlayClick = () => playSound(track.file);
    const onChangeTrackKeyClick = () => changeTrackKey(track);
    const onDeleteTrackClick = () => deleteTrack(track);
    trackRows.push(
      <tr key={index}>
        <td>
          <Button onClick={onPlayClick} text={track.file.name} />
        </td>
        <td>
          <Button
            onClick={onChangeTrackKeyClick}
            disabled={listeningForKey}
            icon={icon}
            text={getKeyText(track, trackChanging)}
          />
        </td>
        <td>
          <Button onClick={onDeleteTrackClick} disabled={listeningForKey} icon="trash" />
        </td>
      </tr>
    );
  });
  return (
    <table className="bp3-html-table bp3-html-table-striped">
      <thead>
        <tr>
          <th>Track</th>
          <th>Keybinding</th>
        </tr>
      </thead>
      <tbody>{trackRows}</tbody>
    </table>
  );
};
