## 2024-05-22 - Accessibility Gaps in HUD Controls
**Learning:** The application's HUD relies heavily on icon-only buttons (SVG) without accessible labels, making it difficult for screen reader users to navigate the primary game controls (Settings, Zoom, Upgrades).
**Action:** Always include `aria-label` for icon-only buttons and consider `title` tooltips for mouse users to clarify functionality.
