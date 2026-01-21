## 2024-05-22 - Icon-Only Buttons Accessibility
**Learning:** Icon-only buttons (like Settings, Zoom, or Close) are invisible to screen readers without `aria-label`. They are also ambiguous to sighted users without `title` tooltips.
**Action:** Always add `aria-label="Action Name"` and `title="Action Name"` to any button that relies solely on an SVG or icon font. This immediately improves usability for everyone.
