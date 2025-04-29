/**
 * Utility to read a file's content as text.
 * Used by the GPXFile component for parsing GPX files.
 *
 * @param file - The file to read
 * @returns A Promise that resolves with the file content as a string
 */
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        resolve(event.target.result);
      } else {
        reject(new Error('Failed to read file content'));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Error reading file: ${file.name}`));
    };

    reader.readAsText(file);
  });
};

export default readFileContent;
