/**
 * Utility to read a file's content as ArrayBuffer.
 * Used by the FITFile component for parsing FIT files.
 *
 * @param file - The file to read
 * @returns A Promise that resolves with the file content as ArrayBuffer
 */
const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target && event.target.result instanceof ArrayBuffer) {
        resolve(event.target.result);
      } else {
        reject(new Error('Failed to read file content as ArrayBuffer'));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Error reading file: ${file.name}`));
    };

    reader.readAsArrayBuffer(file);
  });
};

export default readFileAsArrayBuffer;
