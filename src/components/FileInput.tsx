import * as React from "react";
import { FileChanged } from "./FilePicker";

export interface FileInputProps {
  style?: object;
  onChange: FileChanged;
}

export interface FileEvent {
  target: HTMLInputElement;
}

interface ChildProps {
  onClick: () => void;
}

class FileInput extends React.Component<FileInputProps> {
  fileInput: HTMLInputElement | null;
  handleUpload = (evt: FileEvent) => {
    const file = evt.target.files && evt.target.files[0];
    if (file) {
      this.props.onChange(file);
    }
    if (this.fileInput) {
      this.fileInput.value = "";
    }
  };

  render() {
    return (
      <div style={this.props.style}>
        <input
          type="file"
          style={{ display: "none" }}
          onChange={this.handleUpload}
          ref={ele => (this.fileInput = ele)}
        />
        {React.Children.map(this.props.children, child => {
          if (React.isValidElement<ChildProps>(child)) {
            return React.cloneElement(child, {
              onClick: () => this.fileInput && this.fileInput.click()
            });
          }
          return null;
        })}
      </div>
    );
  }
}

export default FileInput;
