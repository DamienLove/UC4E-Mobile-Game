## 2024-05-22 - Modal Form Accessibility
**Learning:** The settings modal contained range inputs and selects that were visually labeled but programmatically unassociated. Screen readers would announce "slider" or "combobox" without context. Additionally, the modal itself lacked proper ARIA roles, making navigation difficult for assistive tech.
**Action:** Ensure all form inputs have `id` attributes and their labels have matching `htmlFor` attributes. Always add `role="dialog"` and `aria-modal="true"` to custom modals.
