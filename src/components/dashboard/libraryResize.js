// Keep enough room for the center dashboard; never let a dragged sidebar cover its content.
export const LIBRARY_DEFAULT_WIDTH = 330;
export const LIBRARY_MIN_WIDTH = 220;
export const LIBRARY_MAX_WIDTH = 485;
export const LIBRARY_WIDTH_STORAGE_KEY = 'atomxe.dashboard.libraryWidth.v1';

export function constrainLibraryWidth(width, containerWidth) {
  const available = Number.isFinite(containerWidth) && containerWidth > 0
    ? Math.max(LIBRARY_MIN_WIDTH, containerWidth - 560)
    : LIBRARY_DEFAULT_WIDTH;
  const max = Math.min(LIBRARY_MAX_WIDTH, available);
  const value = Number(width);
  return Math.round(Math.max(LIBRARY_MIN_WIDTH, Math.min(max,
    Number.isFinite(value) ? value : LIBRARY_DEFAULT_WIDTH
  )));
}
