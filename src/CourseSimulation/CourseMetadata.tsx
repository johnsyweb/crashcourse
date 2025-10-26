import React, { useState, useEffect } from 'react';
import styles from './CourseMetadata.module.css';

interface CourseMetadataProps {
  metadata: { name?: string; description?: string };
  onMetadataChange: (metadata: { name?: string; description?: string }) => void;
}

const CourseMetadata: React.FC<CourseMetadataProps> = ({ metadata, onMetadataChange }) => {
  const [name, setName] = useState(metadata.name || '');
  const [description, setDescription] = useState(metadata.description || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Only update local state if we're not currently editing
    // This prevents the input fields from being reset while the user is typing
    if (!isEditing) {
      // Use setTimeout to defer state updates to avoid calling setState in effect
      setTimeout(() => {
        setName(metadata.name || '');
        setDescription(metadata.description || '');
      }, 0);
    }
  }, [metadata, isEditing]);

  const handleSave = () => {
    onMetadataChange({
      name: name.trim() || undefined,
      description: description.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(metadata.name || '');
    setDescription(metadata.description || '');
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleSave();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={styles.courseMetadata}>
      <div className={styles.header}>
        <h3>Course Information</h3>
        {!isEditing && (
          <button
            className={styles.editButton}
            onClick={() => setIsEditing(true)}
            title="Edit course information"
          >
            ✏️ Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className={styles.editForm}>
          <div className={styles.field}>
            <label htmlFor="course-name">Course Name:</label>
            <input
              id="course-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter course name"
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="course-description">Description:</label>
            <textarea
              id="course-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter course description"
              className={styles.textarea}
              rows={3}
            />
          </div>
          <div className={styles.actions}>
            <button
              className={styles.saveButton}
              onClick={handleSave}
              title="Save changes (Ctrl+Enter)"
            >
              💾 Save
            </button>
            <button
              className={styles.cancelButton}
              onClick={handleCancel}
              title="Cancel changes (Escape)"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.display}>
          <div className={styles.field}>
            <label>Course Name:</label>
            <div className={styles.value}>
              {metadata.name || <span className={styles.placeholder}>No name set</span>}
            </div>
          </div>
          <div className={styles.field}>
            <label>Description:</label>
            <div className={styles.value}>
              {metadata.description || (
                <span className={styles.placeholder}>No description set</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseMetadata;
