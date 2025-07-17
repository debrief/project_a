# BackChannel UI States and Sidebar Interaction

This document outlines the required behaviors for the BackChannel (BC) icon and sidebar across both capture and review modes.

## 1. BC Icon States

| State | Description | Appearance | Action on Click |
|-------|-------------|------------|-----------------|
| Inactive | No feedback package matches current page | Grey icon | Show onboarding guidance and prompt to create package |
| Active | Feedback package exists, sidebar hidden | Blue icon | Switch to Capture mode and show sidebar |
| Capture | Feedback package exists, sidebar visible, BC icon hidden. Icon revealed (blue) on sidebar close | Icon hidden | n/a |

## 2. Initialization Behavior

When a page loads, BackChannel automatically determines the initial state based on the following logic:

### Page Load State Decision Tree
1. **No feedback package exists for current URL**:
   - Icon: Grey (Inactive)
   - Sidebar: Not created
   - Action: Click opens package creation modal

2. **Feedback package exists + `backchannel-sidebar-visible` localStorage is `false`**:
   - Icon: Blue (Active mode)
   - Sidebar: Created but hidden
   - Action: Click shows sidebar

3. **Feedback package exists + `backchannel-sidebar-visible` localStorage is `true`**:
   - Icon: hidden (Capture mode)
   - Sidebar: Created and automatically visible
   - Action: Click `Close` on sidebar switches to Active (blue) mode and hides sidebar

### Sidebar State Persistence
- Sidebar visibility state is persisted in localStorage using key `backchannel-sidebar-visible`
- State is automatically restored when navigating within the same feedback package
- Restoration occurs seamlessly after UI components are loaded

## 3. Package Creation Flow

- User navigates to the **document root** (typically the welcome or intro page).
- Clicks the grey BC icon, triggering:
  - Onboarding guidance (new window with slides)
  - Detection of single-page vs multi-page content
  - Prompt to create a new feedback package:
    - **Document Name**
    - **Author Name**
    - **Date**
    - **Root Path** (auto-filled from current URL)
- On success, BackChannel transitions to Capture mode (blue icon) with sidebar hidden

## 4. Feedback Capture Interaction

When sidebar is visible, users can capture feedback:

- Sidebar contains:
  - List of existing comments for current page
  - "Capture Feedback" button in toolbar
  - "Export" button in toolbar
  - "X" to close, at top-right
- Click "Capture Feedback" button:
  - Sidebar is temporarily hidden to allow element selection
  - "Cancel selection" button appears in viewport
  - Hover shows highlight over elements
  - Click to select an element OR drag to highlight text
  - Shows **"Add Feedback"** form at top of sidebar
  - Submit or cancel feedback entry
  - ESC key exits capture mode
- Comments are stored in IndexedDB `comments` table

## 5. Review Mode Behavior

When in Review mode (green icon with sidebar visible):

- Sidebar regenerates per page navigation
- Comments for current page are listed in the sidebar
- Sidebar UI state (filters, sort, etc.) is persisted in localStorage
- Clickable comment entries:
  - Scroll to location (if on-page)
  - Navigate with timestamp anchor (if on another page)
- Highlight markers are shown inline for feedback on current page
- Links to other pages with unresolved feedback are decorated
- Resolved comments are hidden by default, toggleable

## 6. Comment Resolution

- Comments can be marked "resolved"
- Resolved status is stored in local IndexedDB
- Default behavior: hide resolved items
- Toggle available to show/hide resolved comments

## 7. Data Management

- Each page load:
  - Check for existing feedback package using `DatabaseService.hasExistingFeedbackPackage()`
  - If package exists: initialize in appropriate state based on `backchannel-sidebar-visible` localStorage
  - If no package: remain in Inactive state (grey icon)
- Sidebar state persistence:
  - `backchannel-sidebar-visible` localStorage key tracks sidebar visibility
  - State persists across page navigation within same feedback package
- Option to **Delete Feedback Package**:
  - Deletes IndexedDB instance and clears local cache
  - Returns to Inactive state
- No document-wide dashboard
  - Review is performed one page at a time via the sidebar

## 8. Complete State Flow Summary

The BackChannel icon follows this state progression:

```
Page Load:
├── No Package → Grey (Inactive)
│   └── Click → Package Creation Modal
│       └── Success → Blue (Active, sidebar hidden)
│
└── Package Exists
    ├── localStorage sidebar = false → Blue (Active, sidebar hidden)
    │   └── Click → Green (Capture, sidebar visible)
    │
    └── localStorage sidebar = true → Icon not shown, capture mode, sidebar visible)
        └── Close sidebar → Blue (Active, sidebar hidden)
```

### State Transitions:
- **Grey → Blue**: Package creation completed
- **Blue → hidden**: User clicks icon to show sidebar
- **hidden → Blue**: User clicks icon to hide sidebar and deactivate

### Key Features:
- State automatically determined on page load
- Sidebar visibility persists across page navigation
- Seamless restoration with no visual indication to user

## 9. Limitations

- Replies to comments are not supported
- Feedback packages must be created from document root for consistency
- Anchor/tag-based comment navigation uses timestamp identifiers