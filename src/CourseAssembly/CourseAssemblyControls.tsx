import React, { useId } from 'react';
import {
  CourseAssemblyParams,
  CourseAssemblyResult,
  DEFAULT_PARKRUN_LENGTH_METERS,
} from '../Course/assembleCourse';
import styles from './CourseAssemblyControls.module.css';

interface CourseAssemblyControlsProps {
  params: CourseAssemblyParams;
  assemblyResult: CourseAssemblyResult | null;
  onChange: (params: CourseAssemblyParams) => void;
}

const CourseAssemblyControls: React.FC<CourseAssemblyControlsProps> = ({
  params,
  assemblyResult,
  onChange,
}) => {
  const targetId = useId();
  const mirrorId = useId();
  const cycleLabel = params.mirror ? 'Out-and-back cycles' : 'Repeats';

  return (
    <div className={styles.assemblyControls}>
      <div className={styles.field}>
        <label htmlFor={targetId}>Target course length (m)</label>
        <input
          id={targetId}
          type="number"
          min={1}
          step={1}
          value={Math.round(params.targetLengthMeters)}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (!Number.isFinite(value) || value <= 0) {
              return;
            }
            onChange({ ...params, targetLengthMeters: value });
          }}
        />
        <button
          type="button"
          className={styles.presetButton}
          onClick={() => onChange({ ...params, targetLengthMeters: DEFAULT_PARKRUN_LENGTH_METERS })}
        >
          Use 5000 m
        </button>
      </div>

      <div className={styles.field}>
        <label htmlFor={mirrorId}>
          <input
            id={mirrorId}
            type="checkbox"
            checked={params.mirror}
            onChange={(event) => onChange({ ...params, mirror: event.target.checked })}
          />
          Mirror between repetitions (out-and-back)
        </label>
      </div>

      {assemblyResult && (
        <dl className={styles.summary}>
          <div>
            <dt>Submitted segment</dt>
            <dd>{(assemblyResult.segmentLengthMeters / 1000).toFixed(2)} km</dd>
          </div>
          <div>
            <dt>{cycleLabel}</dt>
            <dd>{assemblyResult.cycleCount.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Assembled length</dt>
            <dd>{assemblyResult.assembledLengthMeters.toFixed(0)} m</dd>
          </div>
        </dl>
      )}
    </div>
  );
};

export default CourseAssemblyControls;
