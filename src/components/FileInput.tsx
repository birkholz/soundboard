import * as React from "react";

export interface FileInputProps {
  style?: object;
  onChange: (files: File[]) => void;
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
    const files = evt.target.files;
    if (files) {
      this.props.onChange(Array.from(files));
    }
    if (this.fileInput) {
      this.fileInput.value = "";
    }
  };

  render() {
    return (
      <div className="add-button" style={this.props.style}>
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
