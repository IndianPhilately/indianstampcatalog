### Goal
Refactor the search results page to add a toggleable Table/List view alongside the existing Tile view, integrate column-level sorting and filtering, and implement configurable pagination with URL state persistence and mobile safeguards.

---

### Functional Requirements

#### 1. View Toggle (Tile vs. Table)
- **Placement:** Inside the search header, aligned to the right of the heading and result count on desktop.
- **Controls:** Two icon toggle buttons:
  - **Tile View:** Grid icon (e.g., Lucide `LayoutGrid`)
  - **Table View:** Table/List icon (e.g., Lucide `Table` or `List`)
- **UX Details:**
  - Active button must show a distinct selected state (background highlight, border, active ring).
  - Add accessible tooltip overlays on hover (e.g., `"Switch to Grid View"` / `"Switch to Table View"`).
  - Include proper `aria-label` and `aria-pressed` attributes for accessibility.

#### 2. Table / List View
- Render items in a clean, high-density data table.
- **Columns:** Image/Thumbnail, Title/Name, Key Metadata fields (e.g., Category, Date/Year, Tags), and Actions/Details.
- Use consistent sentence/title case for all table headers (for example, “Image” and “Actions”), not all-uppercase labels.
- **Header Features:**
  - **Sorting:** Interactive headers that toggle ascending/descending states with visual indicators (arrows/chevrons).
  - **Filtering:** Show a filter icon beside each sortable column heading. Clicking it opens an accessible popover with a field-appropriate filter; do not show filter fields inline beneath the headings.
  - Title and denomination filters use text input; users can press Enter or select Apply.
  - Category filter is a multi-select limited to these eight allowed values: `National Symbols & Identity`, `Leaders & Personalities`, `Historical Events & Anniversaries`, `Wildlife & Nature`, `Art, Culture & Mythology`, `Science, Technology & Space`, `Sports & International Relations`, and `Landmarks, Architecture & Heritage Sites`.
  - The Tile-view Theme selector uses the same allowed categories and only lists categories present in the current result set.
  - Date / Year filter uses a from/to year range. Popovers provide Apply and Clear actions, close on outside click or Escape, and indicate when a filter is active.
  - Keep table-column filter state in the URL when switching views, but apply it only in Table view. Apply the search-header theme, decade, and denomination filters only in Tile view. This preserves each view's independent filters without letting hidden controls silently affect the other view.
- **Empty State:** If column filters return zero records, render a single full-width empty state row (`colSpan={totalColumns}`) stating: `"No matching results found for the active filters."`

#### 3. Configurable Pagination
- Place pagination controls directly below the results container.
- **Page Size Selector:** Dropdown menu offering `12`, `24`, `48`, and `All`; default to `12`.
- Hide the pagination controls when fewer than `12` results match the active search and filters.
- **Navigation Controls:** "Previous", "Next", and numbered page buttons with the active page highlighted.
- Disable "Previous" on page 1 and "Next" on the final page.
- Keep the selected/default page size consistent across viewport sizes; adapt the grid layout responsively without changing the number of results per page.
- Keep the search heading, result count, and view toggle visible in both views. Show the search-header Theme, Decade, Denomination, and Sort controls only in Tile view; Table view uses its column filter popovers and sortable headers instead, avoiding duplicate controls.

---

### Technical & Architecture Specifications

#### 1. State Management & URL Synchronization
- **URL Query Parameters:** Sync the following values to URL search parameters so views and filters persist across page reloads and back/forward navigation:
  - `view`: `'grid'` | `'table'` (default: `'grid'`)
  - `page`: positive integer (default: `1`)
  - `limit`: items per page (default: `12`)
  - Column filter values where applicable.
- **State Reset Rule:** Automatically reset `page` to `1` whenever:
  - The primary search query updates.
  - Any column filter is changed or cleared.
  - The items-per-page (`limit`) selector value changes.

#### 2. Data Processing (Client vs. Server)
- **Processing Strategy:** Apply pagination, sorting, and column filtering **client-side** over the fetched dataset.
  - Calculate `totalPages = Math.ceil(filteredItems.length / pageSize)`.
  - Slice the array: `displayedItems = filteredSortedItems.slice((page - 1) * pageSize, page * pageSize)`.
  - If handling large datasets or server-side pagination, extract query params into the data fetcher/hook and return metadata (`totalCount`, `page`, `pageSize`).

#### 3. Mobile Responsiveness & Breakpoints
- **Table Handling:** Enclose the Table view in an `overflow-x-auto` wrapper with `min-w-full` to allow smooth horizontal scrolling on touch devices.
- **Mobile Fallback:** On screens below the `md` breakpoint (768px), hide the table toggle and show the responsive grid/card layout, including when the URL requests `view=table`. Use Tile-view filters on mobile; table-specific filters remain in the URL for desktop Table view.

#### 4. Link Styling
- Use the same Roboto font as the homepage (inherited from the global body font) and style table detail links to match the homepage's “Read full entry & philatelic details” link: `text-xs font-semibold text-blue-700`, `hover:text-blue-900`, and a color transition, without a hover underline.

#### 5. Detail Navigation Feedback
- When a search result opens its dynamic stamp detail route, show a page-level loading skeleton while the route data loads.
- Reuse the stamp detail lookup between page rendering and metadata generation within the same request so navigation does not repeat the primary query.

---

### Implementation Instructions
1. **Component Decomposition:** Separate concerns into modular components:
   - `view-toggle.tsx`: Handles icon toggling and tooltip presentation.
   - `results-table.tsx`: Encapsulates the table, sorting headers, column filter popovers, and empty state.
   - `pagination-controls.tsx`: Contains page numbers, next/prev triggers, and page-size dropdown.
2. **Type Safety:** Provide complete TypeScript interfaces for all component props, item data structures, filter state, and view types (`type ViewMode = 'grid' | 'table'`). Avoid `any`.
3. **Styling:** Use Tailwind CSS for all layouts, hover effects, active states, and responsive breakpoints, matching the existing design system.
4. **Deliverables:** Provide the updated/created components and show how they integrate into the main search page wrapper.