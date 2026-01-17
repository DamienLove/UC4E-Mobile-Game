# Palette's Journal

## 2024-05-22 - Accessibility in Modal Components
**Learning:** This codebase uses custom modal implementations without standard accessibility attributes (role="dialog", aria-modal, focus management), which is a common pattern in scratch-built React UI libraries.
**Action:** When encountering custom modals, always check for and add `role="dialog"`, `aria-modal="true"`, and ensure all interactive elements have accessible names (labels/aria-labels).
