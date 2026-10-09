import './luna-ornate.css';

/**
 * Visual-only overlay. Buttons, pointers, focus, hit targets, and layout remain
 * owned by the existing dashboard components underneath it.
 */
export default function LunaOrnateChrome({ variant = 'panel' }) {
  return (
    <div className={`axe-ornate-frame axe-ornate-frame--${variant}`} aria-hidden="true">
      <span className="axe-ornate-frame__rail axe-ornate-frame__rail--top" />
      <span className="axe-ornate-frame__rail axe-ornate-frame__rail--bottom" />
      <span className="axe-ornate-frame__rail axe-ornate-frame__rail--left" />
      <span className="axe-ornate-frame__rail axe-ornate-frame__rail--right" />
      {['tl', 'tr', 'bl', 'br'].map(corner => (
        <span key={corner} className={`axe-ornate-frame__corner axe-ornate-frame__corner--${corner}`} />
      ))}
      <span className="axe-ornate-frame__gem axe-ornate-frame__gem--top" />
      <span className="axe-ornate-frame__gem axe-ornate-frame__gem--bottom" />
    </div>
  );
}
