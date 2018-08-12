import { Button, ContextMenu, Menu, MenuItem, NonIdealState } from "@blueprintjs/core";
import classNames from "classnames";
import * as React from "react";
import { ReactNode, SFC } from "react";
import { keycodeNames } from "../keycodes";
import { Track, UNSET_KEYCODE } from "../types";

export interface TrackListProps {
  tracks: Track[];
  listeningForKey: boolean;
  filtered: boolean | null;
  playSound: (file: string) => Promise<void>;
  changeTrackKey: (track: Track) => void;
  deleteTrack: (track: Track) => void;
}

export interface TrackRowProps {
  index: number;
  track: Track;
  listeningForKey: boolean;
  playSound: (file: string) => Promise<void>;
  changeTrackKey: (track: Track) => void;
  deleteTrack: (track: Track) => void;
}

class TrackRow extends React.Component<TrackRowProps, { isContextMenuOpen: boolean }> {
  public state = { isContextMenuOpen: false };
  public render() {
    const { index, track, playSound, listeningForKey } = this.props;
    const onClickPlay = () => playSound(track.file);
    const classes = classNames("track-row", { "context-menu-open": this.state.isContextMenuOpen });
    const keyDisplay = track.keycode !== UNSET_KEYCODE ? `${keycodeNames[track.keycode]}` : undefined;
    return (
      <div onContextMenu={this.showContextMenu}>
        <Button
          className={classes}
          key={index}
          fill={true}
          onClick={onClickPlay}
          large={true}
          disabled={listeningForKey}
        >
          <span className="track=name">{track.name}</span>
          <span className="track-key">{keyDisplay}</span>
        </Button>
      </div>
    );
  }

  private showContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const { track, changeTrackKey, deleteTrack } = this.props;
    const onChangeTrackKeyClick = () => changeTrackKey(track);
    const onDeleteTrackClick = () => deleteTrack(track);
    ContextMenu.show(
      <Menu>
        <MenuItem onClick={onChangeTrackKeyClick} text="Set Keybind" icon="edit" />
        <MenuItem onClick={onDeleteTrackClick} text="Delete" icon="trash" />
      </Menu>,
      { left: e.clientX, top: e.clientY },
      () => this.setState({ isContextMenuOpen: false })
    );
    // indicate that context menu is open so we can add a CSS class to this element
    this.setState({ isContextMenuOpen: true });
  };
}

export const TrackList: SFC<TrackListProps> = ({
  tracks,
  listeningForKey,
  playSound,
  changeTrackKey,
  deleteTrack,
  filtered
}: TrackListProps) => {
  if (filtered && !tracks.length) {
    return <NonIdealState icon="search" title="No results." />;
  } else if (!tracks.length) {
    const desc = (
      <>
        <p>Add sounds by clicking "Add Sound" below, </p>
        <p>or dragging files into the window.</p>
      </>
    );
    return <NonIdealState icon="add" title="No Sounds" description={desc} />;
  }

  const trackRows: ReactNode[] = tracks.map((track, index) => {
    return (
      <TrackRow
        key={index}
        index={index}
        track={track}
        listeningForKey={listeningForKey}
        playSound={playSound}
        changeTrackKey={changeTrackKey}
        deleteTrack={deleteTrack}
      />
    );
  });

  return <div>{trackRows}</div>;
};
