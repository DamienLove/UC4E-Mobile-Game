## 2024-05-22 - Custom Checkbox Focus Styles
**Learning:** Custom checkboxes implemented with `sr-only` inputs and sibling visual divs often lose keyboard focus indicators.
**Action:** When styling a custom checkbox, always add `peer-focus-visible:ring` styles to the visual sibling element to ensure keyboard users can see when the control is focused.

## 2024-05-22 - HUD Icon Accessibility
**Learning:** Critical HUD controls (Settings, Upgrade, Zoom) were implemented as icon-only buttons without accessible labels, making them invisible to screen readers.
**Action:** Enforce a rule that all icon-only buttons must have both `aria-label` (for AT) and `title` (for mouse users), and decorative icons must use `aria-hidden="true"`.
