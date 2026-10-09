import './library-divider.css';

/**
 * Visual separator only. The Luna library and main dashboard retain their
 * original fixed geometry, so no drag, width state or ratio can move Skill Tree.
 */
export default function LibrarySectionDivider() {
  return <span className="luna-library-divider-track" aria-hidden="true">
    <span className="luna-library-divider-line" />
  </span>;
}
