import React, { useState } from 'react';
import { parseString } from 'xml2js';

const FileUpload = () => {
  const [, setFile] = useState<File | null>(null);
  const [, setGpsPoints] = useState<number[][]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        parseString(fileContent, (err, result) => {
          if (err) {
            console.error('Error parsing GPX file:', err);
          } else {
            const points = result?.gpx?.trk?.[0]?.trkseg?.[0]?.trkpt?.map((pt: { $: { lat: string; lon: string } }) => [
              parseFloat(pt.$.lat),
              parseFloat(pt.$.lon),
            ]) || [];
            setGpsPoints(points);
          }
        });
      };
      reader.readAsText(selectedFile);
    }
  };

  return (
    <div>
      <h2>Upload GPX File</h2>
      <label htmlFor="gpx-file-upload">Select GPX file:</label>
      <input
        id="gpx-file-upload"
        type="file"
        accept=".gpx"
        onChange={handleFileChange}
        aria-label="Upload GPX file"
      />
    </div>
  );
};

export default FileUpload;