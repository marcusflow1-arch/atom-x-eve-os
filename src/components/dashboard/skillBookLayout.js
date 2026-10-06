// Shared boundaries for the Skill Book and the closed-book dashboard hotkeys.
export function skillBookLayout({ width, height, library, attributes, hub, owner }) {
  let left = library?.width > 0 ? library.right : Math.min(330, width * .28);
  let right = attributes?.width > 0 ? attributes.left : width - Math.min(338, width * .3);
  if (right - left < 280) { left = 12; right = width - 12; }
  const gap = Math.max(0, right - left);
  const stacked = gap < 556;
  const mainWidth = Math.max(0, Math.min(348, gap - 24));
  const hudWidth = mainWidth + (stacked ? 0 : 92);
  const bottom = Math.max(0, height - (owner?.height > 0 ? owner.bottom : height - 48));
  return {
    workspace: {
      left: left + 'px', right: Math.max(0, width - right) + 'px',
      top: Math.max(64, hub?.height > 0 ? hub.bottom : 190) + 'px',
      bottom: bottom + 'px',
    },
    hud: {
      position: 'fixed', left: ((left + right - mainWidth) / 2) + 'px',
      width: hudWidth + 'px', bottom: (bottom + 12) + 'px',
    },
    stacked,
  };
}
