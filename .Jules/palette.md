## 2024-05-22 - Custom Checkbox Focus Styles
**Learning:** Custom checkboxes implemented with `sr-only` inputs and sibling visual divs often lose keyboard focus indicators.
**Action:** When styling a custom checkbox, always add `peer-focus-visible:ring` styles to the visual sibling element to ensure keyboard users can see when the control is focused.

## 2024-05-24 - Grouping Accessibility Fixes
**Learning:** Grouping accessibility fixes for related UI areas (like HUD and Modals) creates a more cohesive improvement than scattered fixes.
**Action:** When identifying accessibility gaps, look for patterns across related components (e.g., all icon-only buttons in the main view) and address them in a single pass to ensure a consistent experience.
