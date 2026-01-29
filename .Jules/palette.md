## 2024-05-22 - Custom Checkbox Focus Styles
**Learning:** Custom checkboxes implemented with `sr-only` inputs and sibling visual divs often lose keyboard focus indicators.
**Action:** When styling a custom checkbox, always add `peer-focus-visible:ring` styles to the visual sibling element to ensure keyboard users can see when the control is focused.

## 2024-05-23 - Icon-Only Button Accessibility
**Learning:** Icon-only buttons (common in HUDs) often lack accessible names, making them invisible to screen readers.
**Action:** Always add `aria-label` (for screen readers) and `title` (for mouse tooltips) to icon-only buttons, and hide the decorative SVG with `aria-hidden="true"`.
