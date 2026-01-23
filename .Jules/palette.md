## 2024-05-22 - Custom Checkbox Focus Styles
**Learning:** Custom checkboxes implemented with `sr-only` inputs and sibling visual divs often lose keyboard focus indicators.
**Action:** When styling a custom checkbox, always add `peer-focus-visible:ring` styles to the visual sibling element to ensure keyboard users can see when the control is focused.
