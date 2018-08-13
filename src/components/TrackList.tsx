import { Button, ContextMenu, ControlGroup, EditableText, Menu, MenuItem, NonIdealState } from "@blueprintjs/core";
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
  changeTrackName: (track: Track, name: string) => void;
  deleteTrack: (track: Track) => void;
}

export interface TrackRowProps {
  index: number;
  track: Track;
  listeningForKey: boolean;
  playSound: (file: string) => Promise<void>;
  changeTrackKey: (track: Track) => void;
  changeTrackName: (track: Track, name: string) => void;
  deleteTrack: (track: Track) => void;
}

class TrackRow extends React.Component<TrackRowProps, { isContextMenuOpen: boolean; editingName: boolean }> {
  nameInput: EditableText | null;

  constructor(props: TrackRowProps) {
    super(props);
    this.state = {
      isContextMenuOpen: false,
      editingName: false
    };
    this.nameInput = null;
  }

  showContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const { track, deleteTrack } = this.props;
    const onDeleteTrackClick = () => deleteTrack(track);
    const onRenameTrackClick = () => {
      if (this.nameInput) {
        this.setState({ editingName: true });
      }
    };
    ContextMenu.show(
      <Menu>
        <MenuItem onClick={onRenameTrackClick} text="Rename" icon="edit" />
        <MenuItem onClick={onDeleteTrackClick} text="Delete" icon="trash" />
      </Menu>,
      { left: e.clientX, top: e.clientY },
      () => this.setState({ isContextMenuOpen: false })
    );
    this.setState({ isContextMenuOpen: true });
  };

  render() {
    const { index, track, playSound, listeningForKey, changeTrackKey, changeTrackName } = this.props;
    const { editingName } = this.state;
    const onClickPlay = () => playSound(track.file);
    const classes = classNames("track-row", { "context-menu-open": this.state.isContextMenuOpen });
    const keyDisplay = track.keycode !== UNSET_KEYCODE ? `${keycodeNames[track.keycode]}` : "(unset)";
    const editClasses = classNames({ editable: editingName });
    const onChangeTrackKeyClick = () => changeTrackKey(track);
    const onChangeTrackName = (value: string) => {
      this.setState({ editingName: false });
      changeTrackName(track, value);
      // TODO: Prevent isActive in parent Button???
    };
    return (
      <ControlGroup className={classes} key={index} onContextMenu={this.showContextMenu} fill={true}>
        <Button onClick={onClickPlay} large={true} fill={true} disabled={editingName}>
          <EditableText
            defaultValue={track.name}
            className={editClasses}
            disabled={!editingName}
            isEditing={editingName}
            onConfirm={onChangeTrackName}
            ref={e => (this.nameInput = e)}
          />
        </Button>
        <Button large={true} onClick={onChangeTrackKeyClick} disabled={listeningForKey}>
          {keyDisplay}
        </Button>
      </ControlGroup>
    );
  }
}

export const TrackList: SFC<TrackListProps> = ({
  tracks,
  listeningForKey,
  playSound,
  changeTrackKey,
  changeTrackName,
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
        changeTrackName={changeTrackName}
        deleteTrack={deleteTrack}
      />
    );
  });

  return <div className="track-list">{trackRows}</div>;
};
