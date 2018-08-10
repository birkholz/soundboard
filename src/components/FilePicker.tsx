import * as React from "react";

import FileInput from "./FileInput";

export type FileChanged = (file: File) => void;

export interface FilePickerProps {
  onChange: FileChanged;
  onError: (errorMessage: string) => void;
  maxSize: number;
  extensions: string[];
  style?: object;
}

class FilePicker extends React.Component<FilePickerProps> {
  static defaultProps = {
    maxSize: 20
  };

  validate = (file: File) => {
    const { onError, onChange, maxSize, extensions } = this.props;

    // if we care about file extensions
    if (extensions) {
      const splitFileName = file.name.split(".");
      const uploadedFileExt = splitFileName[splitFileName.length - 1].toLowerCase();
      const isValidFileExt = extensions.map(ext => ext.toLowerCase()).includes(uploadedFileExt);

      if (!isValidFileExt) {
        onError(`Must upload a file of type: ${extensions.join(" or ")}`);
        return;
      }
    }

    // convert maxSize from megabytes to bytes
    const maxBytes = maxSize * 1000000;

    if (file.size > maxBytes) {
      onError(`File size must be less than ${maxSize} MB.`);
      return;
    }

    onChange(file);
  };

  render() {
    const { children, style } = this.props;

    return (
      <FileInput onChange={this.validate} style={style}>
        {children}
      </FileInput>
    );
  }
}

export default FilePicker;
