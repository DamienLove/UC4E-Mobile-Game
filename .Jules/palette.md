## 2024-05-22 - Custom Checkbox Focus Styles
**Learning:** Custom checkboxes implemented with `sr-only` inputs and sibling visual divs often lose keyboard focus indicators.
**Action:** When styling a custom checkbox, always add `peer-focus-visible:ring` styles to the visual sibling element to ensure keyboard users can see when the control is focused.

## 2024-05-24 - HUD Icon Accessibility
**Learning:** In the main HUD, icon-only buttons (like Settings, Zoom, and Upgrade) were implemented without `aria-label` or `title`, making them inaccessible to screen readers and ambiguous for some users.
**Action:** Always verify that buttons without text content have explicit `aria-label` and `title` attributes, especially in the main game interface where they are heavily used.
