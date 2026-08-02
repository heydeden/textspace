export interface CenterBox {
  left: number;
  top: number;
  maxHeight: number;
  maxWidth: number;
}

const EDGE_MARGIN = 8;
const MIN_HEIGHT = 120;
const MAX_HEIGHT_RATIO = 0.7;

// Position the dropdown menu fixed in the center of the viewport.
// Tall menus are clamped to 70% of the viewport height (and never past the
// edge margins) so they stay fully visible and scroll internally.
export function centerMenuBox(
  viewportWidth: number,
  viewportHeight: number,
  menuWidth: number,
  menuHeight: number
): CenterBox {
  const maxHeight = Math.min(
    Math.max(MIN_HEIGHT, Math.round(viewportHeight * MAX_HEIGHT_RATIO)),
    Math.max(1, viewportHeight - EDGE_MARGIN * 2)
  );
  const height = Math.min(menuHeight, maxHeight);
  const maxWidth = Math.max(1, viewportWidth - EDGE_MARGIN * 2);
  const width = Math.min(menuWidth, maxWidth);
  return {
    left: Math.max(EDGE_MARGIN, Math.round((viewportWidth - width) / 2)),
    top: Math.max(EDGE_MARGIN, Math.round((viewportHeight - height) / 2)),
    maxHeight,
    maxWidth,
  };
}
