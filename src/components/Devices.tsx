import { Button, ControlGroup, MenuItem } from "@blueprintjs/core";
import { IListItemsProps, ItemPredicate, Select } from "@blueprintjs/select";
import * as React from "react";
import { MouseEvent, SFC } from "react";
import { OutputNumber, Outputs } from "../types";

export interface DevicesProps {
  devices: MediaDeviceInfo[];
  outputs: Outputs;
  onItemSelect: (device: MediaDeviceInfo, outputNumber: OutputNumber) => void;
}

interface DeviceRendererProps {
  modifiers: {
    active: boolean;
    disabled: boolean;
  };
  handleClick: (event: MouseEvent<HTMLElement>) => void;
}

const DeviceRenderer = (device: MediaDeviceInfo, { handleClick, modifiers }: DeviceRendererProps) => (
  <MenuItem
    active={modifiers.active}
    disabled={modifiers.disabled}
    key={device.deviceId}
    text={device.label}
    onClick={handleClick}
  />
);

const DeviceSelect = Select.ofType<MediaDeviceInfo>();

const predicate = (outputs: Outputs): ItemPredicate<MediaDeviceInfo> => (_, item) => !outputs.includes(item);

const onSelect = (
  onItemSelect: DevicesProps["onItemSelect"],
  outputNumber: OutputNumber
): IListItemsProps<MediaDeviceInfo>["onItemSelect"] => item => onItemSelect(item, outputNumber);

export const Devices: SFC<DevicesProps> = ({ devices, outputs, onItemSelect }: DevicesProps) => {
  return (
    <ControlGroup className="devices" fill={true}>
      <Button className="volume-button bp3-fixed" disabled={true} icon="volume-up" />
      <DeviceSelect
        filterable={false}
        items={devices}
        itemPredicate={predicate(outputs)}
        itemRenderer={DeviceRenderer}
        onItemSelect={onSelect(onItemSelect, OutputNumber.One)}
        noResults={<MenuItem disabled={true} text="None" />}
      >
        <Button rightIcon="caret-down" text={outputs[0] ? outputs[0].label : "(Loading...)"} />
      </DeviceSelect>
      <DeviceSelect
        filterable={false}
        items={devices}
        itemPredicate={predicate(outputs)}
        itemRenderer={DeviceRenderer}
        onItemSelect={onSelect(onItemSelect, OutputNumber.Two)}
        noResults={<MenuItem disabled={true} text="None" />}
      >
        <Button rightIcon="caret-down" text={outputs[1] ? outputs[1].label : "(Loading...)"} />
      </DeviceSelect>
    </ControlGroup>
  );
};
