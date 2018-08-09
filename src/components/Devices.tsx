import { Button, FormGroup, MenuItem } from "@blueprintjs/core";
import { IListItemsProps, ItemPredicate, Select } from "@blueprintjs/select";
import * as React from "react";
import { MouseEvent, SFC } from 'react';
import Playback, { OutputNumber } from "../playback";

export interface DevicesProps {
    devices: MediaDeviceInfo[],
    device1: MediaDeviceInfo,
    device2: MediaDeviceInfo,
    onItemSelect: Playback["setOutput"];
}

interface DeviceRendererProps {
    modifiers: {
        active: boolean;
        disabled: boolean;
    };
    handleClick: (event: MouseEvent<HTMLElement>) => void;
}

const DeviceRenderer = (device: MediaDeviceInfo, { handleClick, modifiers }: DeviceRendererProps) =>
    <MenuItem
        active={modifiers.active}
        disabled={modifiers.disabled}
        key={device.deviceId}
        text={device.label}
        onClick={handleClick}
    />

const DeviceSelect = Select.ofType<MediaDeviceInfo>()

const predicate = (deviceType: MediaDeviceInfo): ItemPredicate<MediaDeviceInfo> =>
    (query, item) => item !== deviceType

const onSelect = (
    onItemSelect: DevicesProps["onItemSelect"],
    outputNumber: OutputNumber,
): IListItemsProps<MediaDeviceInfo>["onItemSelect"] =>
    item => onItemSelect(item, outputNumber)

export const Devices: SFC<DevicesProps> = ({
    devices,
    device1,
    device2,
    onItemSelect,
}: DevicesProps) => {
    return (
      <FormGroup>
        <DeviceSelect
          filterable={false}
          items={devices}
          itemPredicate={predicate(device2)}
          itemRenderer={DeviceRenderer}
          onItemSelect={onSelect(onItemSelect, OutputNumber.One)}
          noResults={<MenuItem disabled={true} text="None" />}>
          <Button rightIcon="caret-down"
                  text={device1 ? device1.label : "(Loading...)"} />
        </DeviceSelect>
        <DeviceSelect
          filterable={false}
          items={devices}
          itemPredicate={predicate(device1)}
          itemRenderer={DeviceRenderer}
          onItemSelect={onSelect(onItemSelect, OutputNumber.Two)}
          noResults={<MenuItem disabled={true} text="None" />}>
          <Button rightIcon="caret-down"
                  text={device2 ? device2.label : "(Loading...)"} />
        </DeviceSelect>
      </FormGroup>
    );
}
