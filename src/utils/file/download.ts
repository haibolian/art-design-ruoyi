import FileSaver from 'file-saver'

export const downloadBlob = (blob: Blob, fileName: string) => {
  FileSaver.saveAs(blob, fileName)
}

export const createTimestampedFilename = (prefix: string, extension: string) => {
  const ext = extension.startsWith('.') ? extension : `.${extension}`
  return `${prefix}_${Date.now()}${ext}`
}
