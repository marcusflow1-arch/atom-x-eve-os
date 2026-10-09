// The divider defines the left/right WIDTH RATIO of the dashboard.
// Both panes resize together; a minimum right-hand workspace remains available.
export const LIBRARY_DEFAULT_WIDTH = 330;
export const LIBRARY_MIN_WIDTH = 220;
export const LIBRARY_MAX_WIDTH = 1200;
export const LIBRARY_MAX_FRACTION = 0.70;
export const MAIN_MIN_WIDTH = 450;
export const LIBRARY_WIDTH_STORAGE_KEY = 'atomxe.dashboard.libraryWidth.v1'; // migration
export const LIBRARY_RATIO_STORAGE_KEY = 'atomxe.dashboard.libraryRatio.v2';

export function constrainLibraryWidth(width, containerWidth) {
  const available = Number.isFinite(containerWidth) && containerWidth > 0
    ? containerWidth : 1280;
  const cap = Math.max(LIBRARY_MIN_WIDTH, Math.min(
    LIBRARY_MAX_WIDTH, available * LIBRARY_MAX_FRACTION, available - MAIN_MIN_WIDTH,
  ));
  const value = Number(width);
  return Math.round(Math.max(LIBRARY_MIN_WIDTH, Math.min(cap,
    Number.isFinite(value) ? value : LIBRARY_DEFAULT_WIDTH
  )));
}

export function libraryWidthFromRatio(ratio, containerWidth) {
  const available = Number.isFinite(containerWidth) && containerWidth > 0
    ? containerWidth : 1280;
  return constrainLibraryWidth(Number(ratio) * available, available);
}
export function libraryRatioFromWidth(width, containerWidth) {
  const available = Number.isFinite(containerWidth) && containerWidth > 0
    ? containerWidth : 1280;
  return constrainLibraryWidth(width, available) / available;
}
