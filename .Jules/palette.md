## 2024-05-22 - Custom Checkbox Focus Styles
**Learning:** Custom checkboxes implemented with `sr-only` inputs and sibling visual divs often lose keyboard focus indicators.
**Action:** When styling a custom checkbox, always add `peer-focus-visible:ring` styles to the visual sibling element to ensure keyboard users can see when the control is focused.

## 2025-05-23 - Icon-Only Buttons
**Learning:** The HUD implementation uses many icon-only buttons for critical actions (Settings, Inventory, Zoom) which are invisible to screen readers.
**Action:** Always verify that icon-only buttons have an explicit `aria-label` describing the action, and that the internal icon element has `aria-hidden="true"` to prevent redundant announcements.
