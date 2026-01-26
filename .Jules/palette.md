## 2024-05-22 - Custom Checkbox Focus Styles
**Learning:** Custom checkboxes implemented with `sr-only` inputs and sibling visual divs often lose keyboard focus indicators.
**Action:** When styling a custom checkbox, always add `peer-focus-visible:ring` styles to the visual sibling element to ensure keyboard users can see when the control is focused.

## 2024-05-23 - Accessible Icon-Only Buttons
**Learning:** Icon-only buttons relying solely on `title` attributes are often missed or poorly announced by screen readers.
**Action:** Always pair `title` (for tooltips) with `aria-label` (for screen readers) on the button element, and hide decorative icons with `aria-hidden="true"`.
