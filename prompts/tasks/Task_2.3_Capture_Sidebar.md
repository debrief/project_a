# APM Task Assignment: Capture Sidebar Implementation

## 1. Agent Role & APM Context

**Introduction:** You are activated as an Implementation Agent within the Agentic Project Management (APM) framework for the BackChannel project.

**Your Role:** You are responsible for executing the assigned task diligently and logging your work meticulously in the project's Memory Bank system.

**Workflow:** You will interact with the Manager Agent through the User and contribute to the structured Memory Bank located in `/Memory/` directories organized by implementation phases.

## 2. Task Assignment

**Reference Implementation Plan:** This assignment corresponds to `Phase 2, Task 2.3: Capture Sidebar` in the Implementation Plan.

**Objective:** Implement the sidebar for managing feedback capture, providing the core interface for users to interact with the feedback system including comment display, capture mode toggling, and export functionality.

**Detailed Action Steps:**

1. **Create sidebar UI with toggle functionality**
   - Design and implement a collapsible sidebar component that can be toggled open/closed
   - Position sidebar on the right side of the screen with appropriate z-index
   - Ensure sidebar doesn't interfere with existing page content
   - Use CSS transitions for smooth animations when opening/closing


2. **Implement sidebar state persistence and initialization behavior**
   - Use localStorage key `backchannel-sidebar-visible` to track sidebar visibility state
   - Save state when user manually opens/closes the sidebar
   - **CRITICAL INITIALIZATION BEHAVIOR**: When a page loads:
     * **If NO feedback package exists for this URL**: BackChannel should be in **inactive mode** (grey icon state)
     * **If feedback package exists for this URL AND `backchannel-sidebar-visible` is `false`**: BackChannel should be in **active mode** (blue icon state) - one click opens sidebar
     * **If feedback package exists for this URL AND `backchannel-sidebar-visible` is `true`**: BackChannel should be in **capture mode** (green icon state) with sidebar automatically visible
     * This creates a seamless workflow: grey (no package) → blue (package exists, sidebar closed) → green (package exists, sidebar open)
   - Restore sidebar visibility when navigating to any page within the same feedback package (same document root URL)
   - Restoration should occur after UI components are fully loaded and sidebar element exists in DOM
   - If localStorage shows sidebar was visible, restore to visible and automatically load/show comments for the current page
   - Keep localStorage value unchanged during restoration process (don't modify during restore)
   - If restoration fails (e.g., sidebar element not found, comments can't load), log error to console but don't show sidebar
   - No visual indication to user that sidebar was auto-restored - make it appear seamless
   - Handle edge cases like localStorage being unavailable
3. **Implement "Capture Feedback" and "Export" buttons in toolbar at top of panel**
   - Create a toolbar section at the top of the sidebar
   - Add "Capture Feedback" button that initiates element selection mode
   - Add "Export" button for CSV export functionality
   - Style buttons consistently with the overall design system
   - Ensure buttons are accessible and clearly labeled

4. **Handle "Capture Feedback" mode interaction**
   - When "Capture Feedback" is clicked: hide sidebar to allow element selection
   - Display a "Cancel selection" button in the top-right corner of the viewport
   - Log element details to console when an element is clicked during capture mode
   - Return sidebar to visible state after element selection or cancellation
   - Provide clear visual feedback about the current state (capture mode active/inactive)

5. **Add list of comments in sidebar**
   - Create a scrollable list section below the toolbar
   - Display comments from the current feedback package for the current page
   - Show comment metadata: element label, comment text, timestamp, reviewer initials
   - Implement proper styling for comment entries (consistent spacing, typography)
   - Handle empty state when no comments exist

6. **Update e2e tests to verify sidebar functionality**
   - Create tests that verify sidebar toggle functionality
   - Test that "Capture Feedback" button properly initiates capture mode
   - Test that "Cancel selection" button properly exits capture mode
   - Verify seeded database comments are displayed in the sidebar
   - Test sidebar state persistence and automatic restoration across page reloads and navigation within the same feedback package
   - Verify restoration only occurs within same feedback package (same document root URL)
   - Test that restoration happens after UI components are loaded
   - Test that comments for current page are automatically loaded during restoration
   - Test error handling when restoration fails (recommend use of `tests/e2e/fixtures/enabled-test/enabled` for multi-page testing)

**Integration Requirements:**
- Connect to existing storage service to retrieve comments for current page
- Integrate with the BC icon state management from Task 2.1
- Ensure sidebar works with the feedback package system from Task 2.2
- **CRITICAL**: Update main plugin initialization logic to start in capture mode when feedback package exists
- Follow the UI state behaviors defined in `docs/project/UI-states.md`

**Technical Constraints:**
- Use TypeScript with no `any` types
- Follow existing code conventions and patterns
- Implement using Lit web components for consistency
- Ensure accessibility standards are met
- Test with fixtures in `test/e2e/fixtures/enabled-test` (enabled and disabled sub-folders)

## 3. Expected Output & Deliverables

**Define Success:** 
- Sidebar successfully toggles open/closed with smooth animations
- Toolbar with "Capture Feedback" and "Export" buttons is functional
- Capture mode properly hides sidebar and shows cancel button
- Comment list displays seeded database comments for current page
- **CRITICAL**: Correct initialization states based on feedback package and localStorage:
  * Grey (inactive) when no feedback package exists
  * Blue (active) when feedback package exists but sidebar localStorage is false
  * Green (capture) when feedback package exists and sidebar localStorage is true, with sidebar automatically visible
- Sidebar state persists and automatically restores when navigating within the same feedback package
- Restoration is seamless with no visual indication to the user
- Comments for current page are automatically loaded during restoration
- All e2e tests pass and verify the described functionality

**Specify Deliverables:**
1. Updated sidebar UI component with toggle functionality
2. Toolbar implementation with capture and export buttons
3. Capture mode interaction handling with cancel functionality
4. Comment list display with proper formatting
5. **CRITICAL**: Fixed main plugin initialization to start in capture mode when feedback package exists
6. localStorage integration for state persistence and automatic restoration across pages in same feedback package
7. Updated e2e tests that verify all sidebar functionality including correct initialization behavior
8. Console logging of element details during capture mode

**Format:** TypeScript/JavaScript code following existing project patterns, with accompanying Playwright e2e tests.

## 4. Memory Bank Logging Instructions

Upon successful completion of this task, you **must** log your work comprehensively to the project's Memory Bank system in the appropriate `/Memory/Phase_2_Capture_Mode_Core/Task_2_3_Capture_Sidebar/` directory.

**Format Adherence:** Adhere strictly to the established logging format as defined in `prompts/02_Utility_Prompts_And_Format_Definitions/Memory_Bank_Log_Format.md`. Ensure your log includes:
- A reference to the assigned task (Phase 2, Task 2.3) in the Implementation Plan
- A clear description of the actions taken and components implemented
- Key code snippets for the sidebar component, toolbar, and capture mode handling
- Any key decisions made regarding state management and UI interactions
- Any challenges encountered and how they were resolved
- Confirmation of successful execution including test results

**Memory Bank Structure:** Ensure all Memory Bank directory and file creations strictly adhere to the naming conventions and structural guidelines. All names and structures must be validated against the current `Implementation_Plan.md` before creation.

## 5. Clarification Instruction

If any part of this task assignment is unclear, please state your specific questions before proceeding. Pay particular attention to the integration points with existing components and the specific UI behaviors outlined in the project documentation.