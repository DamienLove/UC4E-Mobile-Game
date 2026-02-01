## 2024-05-22 - Custom Checkbox Focus Styles
**Learning:** Custom checkboxes implemented with `sr-only` inputs and sibling visual divs often lose keyboard focus indicators.
**Action:** When styling a custom checkbox, always add `peer-focus-visible:ring` styles to the visual sibling element to ensure keyboard users can see when the control is focused.

## 2026-02-01 - Icon-Only Button Accessibility
**Learning:** The codebase heavily utilizes icon-only buttons (HUD, Modals) using SVGs but consistently omits `aria-label` and `aria-hidden` on the icons.
**Action:** When creating or modifying icon-only buttons, strictly enforce the `aria-label` attribute on the button and `aria-hidden="true"` on the inner SVG to prevent screen reader redundancy.
