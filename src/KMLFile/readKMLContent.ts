import JSZip from 'jszip';

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        resolve(event.target.result);
      } else {
        reject(new Error('Failed to read KMZ file content'));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Error reading file: ${file.name}`));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Reads KML text from a `.kml` file or extracts embedded KML from a `.kmz` archive.
 */
const readKMLContent = async (file: File): Promise<string> => {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.kmz')) {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    let archive: JSZip;

    try {
      archive = await JSZip.loadAsync(arrayBuffer);
    } catch (error) {
      throw new Error('Invalid KMZ file: unable to read zip archive.', { cause: error });
    }

    const kmlEntries = Object.keys(archive.files).filter(
      (path) => !archive.files[path].dir && path.toLowerCase().endsWith('.kml')
    );

    if (kmlEntries.length === 0) {
      throw new Error('Invalid KMZ file: no KML document found inside the archive.');
    }

    const preferredEntry =
      kmlEntries.find((path) => path.toLowerCase().endsWith('doc.kml')) ?? kmlEntries[0];

    return archive.file(preferredEntry)!.async('string');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        resolve(event.target.result);
      } else {
        reject(new Error('Failed to read KML file content'));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Error reading file: ${file.name}`));
    };

    reader.readAsText(file);
  });
};

export default readKMLContent;
