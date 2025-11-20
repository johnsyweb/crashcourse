import React from 'react';
import styles from './FileUploadSection.module.css';

const FileUploadSection = ({
  handleFileChange,
}: {
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <div className={styles.uploadSection}>
      <h2>Import Course</h2>
      <p className={styles.uploadDescription}>Select a GPX or FIT file to begin</p>
      <button
        className={styles.uploadButton}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.gpx,.fit,.fit.gz';
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
        Choose File
      </button>
    </div>
  );
};

export default FileUploadSection;
