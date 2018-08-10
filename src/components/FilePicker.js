import * as React from 'react'
import PropTypes from 'prop-types'

import FileInput from './FileInput'

class FilePicker extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    onChange: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    // max file size in MB
    maxSize: PropTypes.number,
    // file extension
    extensions: PropTypes.array,
    // validate file contents
    validateContent: PropTypes.func,
    style: PropTypes.object
  }

  static defaultProps = {
    maxSize: 20
  }

  _validate = file => {
    const {
      onError,
      onChange,
      maxSize,
      extensions
    } = this.props

    if (!file) {
      onError('Failed to upload a file.')
      return
    }

    // if we care about file extensions
    if (extensions) {
      const uploadedFileExt = file.name.split('.').pop().toLowerCase()
      const isValidFileExt = extensions.map(ext => ext.toLowerCase()).includes(uploadedFileExt)

      if (!isValidFileExt) {
        onError(`Must upload a file of type: ${extensions.join(' or ')}`)
        return
      }
    }

    // convert maxSize from megabytes to bytes
    const maxBytes = maxSize * 1000000

    if (file.size > maxBytes) {
      onError(`File size must be less than ${maxSize} MB.`)
      return
    }

    onChange(file)
  }

  render() {
    const {children, style} = this.props

    return (
      <FileInput onChange={this._validate} style={style}>
        {children}
      </FileInput>
    )
  }
}

export default FilePicker
