import React, { useState } from 'react';

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('File content:', e.target?.result);
        // Process the GPX file content here
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