import './luna-light-edge.css';

// Low-profile glass outline inspired by the ornate AI Attribute chrome,
// but deliberately lighter: fine stepped corners and restrained cyan pins.
export default function LunaLightEdge({ variant = 'skills' }) {
  return <span className={`luna-light-edge luna-light-edge--${variant}`} aria-hidden="true">
    <span className="luna-light-edge__corner luna-light-edge__corner--tl" />
    <span className="luna-light-edge__corner luna-light-edge__corner--tr" />
    <span className="luna-light-edge__corner luna-light-edge__corner--bl" />
    <span className="luna-light-edge__corner luna-light-edge__corner--br" />
    <span className="luna-light-edge__pin luna-light-edge__pin--top" />
    <span className="luna-light-edge__pin luna-light-edge__pin--bottom" />
  </span>;
}
