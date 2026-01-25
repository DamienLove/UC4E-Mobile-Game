## 2024-05-22 - Custom Checkbox Focus Styles
**Learning:** Custom checkboxes implemented with `sr-only` inputs and sibling visual divs often lose keyboard focus indicators.
**Action:** When styling a custom checkbox, always add `peer-focus-visible:ring` styles to the visual sibling element to ensure keyboard users can see when the control is focused.

## 2024-05-23 - HUD Icon Accessibility
**Learning:** Icon-only buttons in HUDs (Heads Up Displays) create "silent" zones for screen readers if not explicitly labeled.
**Action:** Always pair `aria-label` with `aria-hidden="true"` on the inner SVG to ensure the action is described, not the graphic.
