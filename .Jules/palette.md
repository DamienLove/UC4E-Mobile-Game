## 2024-05-22 - Custom Checkbox Focus Styles
**Learning:** Custom checkboxes implemented with `sr-only` inputs and sibling visual divs often lose keyboard focus indicators.
**Action:** When styling a custom checkbox, always add `peer-focus-visible:ring` styles to the visual sibling element to ensure keyboard users can see when the control is focused.

## 2024-05-24 - Modal Accessibility Consistency
**Learning:** Custom modals (`UpgradeModal`, `CrossroadsModal`) often lack standard accessibility roles (`dialog`, `aria-modal`) unlike `SettingsModal` which implemented them correctly.
**Action:** When touching any modal component, verify `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` are present to ensure consistent screen reader support.
