## 2024-05-23 - [Project Structure Ambiguity]
**Learning:** The project contains duplicate component directories (`src/components/` and `components/`). The root `index.tsx` imports from `components/`, making it the active source. Changes to `src/components/` have no effect on the running app.
**Action:** Always verify `index.html` and entry points (`index.tsx`) to determine the active file structure before editing.

## 2024-05-23 - [Accessible Icon Buttons]
**Learning:** Many interactive elements were icon-only without accessible names. Adding `aria-label` and `title` attributes significantly improves accessibility and usability (tooltips) with minimal code change.
**Action:** Systematically check for icon-only buttons (`svg` inside `button`) and ensure they have `aria-label` matching their function.
