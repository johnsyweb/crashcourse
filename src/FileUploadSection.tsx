import React from 'react';

const FileUploadSection = ({
  handleFileChange,
}: {
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <div>
      <h2>Upload GPX File</h2>
      <button
        className="upload-button"
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.gpx';
          input.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            if (target && target.files) {
              handleFileChange({
                target,
              } as React.ChangeEvent<HTMLInputElement>);
            }
          };
          input.click();
        }}
      >
        Select GPX File
      </button>
    </div>
  );
};

export default FileUploadSection;
