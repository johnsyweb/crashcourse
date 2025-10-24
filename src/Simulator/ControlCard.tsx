import React, { useEffect, useState } from 'react';
import styles from './ControlCard.module.css';

interface ControlCardProps {
  title?: string;
  children?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

const ControlCard: React.FC<ControlCardProps> = ({ title, children, compact, className }) => {
  const [expanded, setExpanded] = useState<boolean>(true);

  useEffect(() => {
    // Collapse by default on small screens to preserve vertical space.
    try {
      if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(max-width:480px)').matches
      ) {
        setExpanded(false);
      }
    } catch {
      // ignore
    }

    const handler = (e: Event) => {
      // toggle-control-cards event toggles expansion state for all cards
      const detail = (e as CustomEvent)?.detail;
      if (detail && typeof detail.expanded === 'boolean') {
        setExpanded(detail.expanded);
      } else {
        setExpanded((v) => !v);
      }
    };

    window.addEventListener('toggle-control-cards', handler as EventListener);
    return () => window.removeEventListener('toggle-control-cards', handler as EventListener);
  }, []);

  return (
    <div
      className={`${styles.controlCard} ${className || ''} ${expanded ? styles.expanded : styles.collapsed}`}
    >
      {title ? (
        <div className={styles.header}>
          {title}
          <button
            aria-label={expanded ? 'Collapse controls' : 'Expand controls'}
            aria-expanded={expanded}
            className={styles.toggleButton}
            onClick={() => setExpanded((v) => !v)}
            type="button"
          >
            <span className={styles.chevron}>{expanded ? '▾' : '▸'}</span>
          </button>
        </div>
      ) : null}
      <div className={`${styles.content} ${compact ? styles.compact : ''}`}>{children}</div>
    </div>
  );
};

export default ControlCard;
