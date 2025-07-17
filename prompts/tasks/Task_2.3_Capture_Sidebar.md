# APM Task Assignment: Capture Sidebar Implementation

## 1. Agent Role & APM Context

You are activated as an Implementation Agent within the Agentic Project Management (APM) framework for the BackChannel project. Your role is to execute assigned tasks diligently and log work meticulously in the Memory Bank system. You will interact with the Manager Agent (via the User) and contribute to the overall project success through careful implementation of your assigned components.

## 2. Task Assignment

**Reference Implementation Plan:** This assignment corresponds to `Phase 2, Task 2.3: Capture Sidebar` in the Implementation Plan.

**Objective:** Implement the sidebar for managing feedback capture, including toggle functionality, toolbar buttons, comment display, and state persistence.

**Detailed Action Steps:**

1. **Create sidebar UI with toggle functionality**
   - Implement a collapsible sidebar component that can be shown/hidden
   - Position sidebar on the right side of the viewport
   - Use CSS transitions for smooth show/hide animations
   - Ensure sidebar has proper z-index to appear above page content

2. **Implement sidebar state persistence (visibility)**
   - Use localStorage key `backchannel-sidebar-visible` to track sidebar state
   - Persist sidebar visibility across page reloads and navigation
   - Restore sidebar state seamlessly after page load
   - Ensure state changes are immediately reflected in localStorage

3. **Implement "Capture Feedback" and "Export" buttons in toolbar at top of panel**
   - Create a toolbar section at the top of the sidebar
   - Add "Capture Feedback" button that initiates element selection mode
   - Add "Export" button for CSV export functionality
   - Style buttons consistently with overall UI theme
   - Ensure buttons are properly sized and accessible

4. **Implement capture feedback interaction flow**
   - On "Capture Feedback" button click:
     - Hide the sidebar temporarily to allow element selection
     - Enable element selection mode on the page
     - Show a "Cancel selection" button in the top-right of the viewport
     - Write selected element details to console for debugging
     - Return sidebar to visible state after element selection or cancel

5. **Add list of comments in sidebar**
   - Create a scrollable list area below the toolbar
   - Display existing comments for the current page
   - Show comment metadata (timestamp, element info, text preview)
   - Ensure comments from seeded database are properly displayed
   - Handle empty state when no comments exist

**UI State Constraints (from UI-states.md):**
- Sidebar should only be created when a feedback package exists
- When sidebar is visible, the BC icon should be hidden (Capture mode)
- When sidebar is closed, transition to Active mode (blue icon, sidebar hidden)
- Sidebar contains close button ("X") at top-right
- Sidebar visibility state must persist using `backchannel-sidebar-visible` localStorage key

**Integration Requirements:**
- Connect with existing storage service to retrieve comments for current page
- Integrate with BC icon state management system
- Ensure proper coordination with element selection functionality
- Work with existing CSS/styling system

## 3. Expected Output & Deliverables

**Define Success:** 
- Sidebar component is fully functional with smooth show/hide transitions
- Toolbar buttons are properly implemented and responsive
- Comment list displays seeded database comments correctly
- Sidebar state persistence works across page navigation
- Element selection flow works as specified (sidebar hides, selection occurs, sidebar returns)

**Specify Deliverables:**
- Modified/created files for sidebar implementation
- CSS styling for sidebar component and animations
- JavaScript/TypeScript functionality for sidebar behavior
- Integration with localStorage for state persistence
- Updated e2e tests that verify sidebar functionality and seeded comment display

**Testing Requirements:**
- E2e tests must verify sidebar functionality works correctly
- Tests should confirm seeded database comments are displayed in sidebar
- Verify state persistence across page reloads
- Test capture feedback button interaction flow

## 4. Memory Bank Logging Instructions

Upon successful completion of this task, you **must** log your work comprehensively to the appropriate Memory Bank directory (`/Memory/Phase_2_Capture_Mode_Core/Task_2_3_Capture_Sidebar/`). 

Adhere strictly to the established logging format. Ensure your log includes:
- A reference to the assigned task in the Implementation Plan
- A clear description of the actions taken
- Any code snippets generated or modified
- Key decisions made regarding UI implementation and state management
- Any challenges encountered with sidebar positioning or state persistence
- Confirmation of successful execution (e.g., tests passing, sidebar functioning correctly)

## 5. Clarification Instruction

If any part of this task assignment is unclear, please state your specific questions before proceeding. Pay particular attention to the UI state requirements and ensure your implementation aligns with the specified behavior in the UI-states.md document.