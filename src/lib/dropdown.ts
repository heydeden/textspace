// Dropdown menu renders with a 4px gap (mt-1 / mb-1) from the trigger.
const MENU_GAP = 4;

export function shouldFlipUp(rectBottom: number, menuHeight: number, viewportHeight: number): boolean {
  return rectBottom + MENU_GAP + menuHeight >= viewportHeight;
}
