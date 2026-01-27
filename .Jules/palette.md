## 2024-05-22 - Custom Checkbox Focus Styles
**Learning:** Custom checkboxes implemented with `sr-only` inputs and sibling visual divs often lose keyboard focus indicators.
**Action:** When styling a custom checkbox, always add `peer-focus-visible:ring` styles to the visual sibling element to ensure keyboard users can see when the control is focused.

## 2024-05-23 - Icon-Only Button Accessibility
**Learning:** Icon-only buttons (like Settings or Zoom) are invisible to screen readers without labels.
**Action:** Always add `aria-label="Action Name"` to the `<button>` and `aria-hidden="true"` to the internal `<svg>` to provide a clean, accessible experience.
