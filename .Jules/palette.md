## 2024-05-22 - Custom Checkbox Focus Styles
**Learning:** Custom checkboxes implemented with `sr-only` inputs and sibling visual divs often lose keyboard focus indicators.
**Action:** When styling a custom checkbox, always add `peer-focus-visible:ring` styles to the visual sibling element to ensure keyboard users can see when the control is focused.

## 2024-05-24 - Dual Labeling for Icon-Only Buttons
**Learning:** Icon-only buttons in the HUD lack both accessible names and visual text labels, confusing both screen reader and mouse users.
**Action:** Always pair `aria-label` (for screen readers) with a matching `title` attribute (native tooltip) for icon-only buttons to provide universal clarity.
