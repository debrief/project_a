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

2. **Implement "Capture Feedback" and "Export" buttons in toolbar at top of panel**
   - Create a toolbar section at the top of the sidebar
   - Add "Capture Feedback" button that initiates element selection mode
   - Add "Export" button for CSV export functionality
   - Style buttons consistently with the overall design system
   - Ensure buttons are accessible and clearly labeled

3. **Handle "Capture Feedback" mode interaction**
   - When "Capture Feedback" is clicked: hide sidebar to allow element selection
   - Display a "Cancel selection" button in the top-right corner of the viewport
   - Log element details to console when an element is clicked during capture mode
   - Return sidebar to visible state after element selection or cancellation
   - Provide clear visual feedback about the current state (capture mode active/inactive)

4. **Add list of comments in sidebar**
   - Create a scrollable list section below the toolbar
   - Display comments from the current feedback package for the current page
   - Show comment metadata: element label, comment text, timestamp, reviewer initials
   - Implement proper styling for comment entries (consistent spacing, typography)
   - Handle empty state when no comments exist

5. **Implement sidebar state persistence (visibility)**
   - Use localStorage to remember sidebar open/closed state
   - Restore sidebar state on page load/reload
   - Key should be namespaced to avoid conflicts with other applications
   - Handle edge cases like localStorage being unavailable

6. **Update e2e tests to verify sidebar functionality**
   - Create tests that verify sidebar toggle functionality
   - Test that "Capture Feedback" button properly initiates capture mode
   - Test that "Cancel selection" button properly exits capture mode
   - Verify seeded database comments are displayed in the sidebar
   - Test sidebar state persistence across page reloads and navigation to a new page under the same document (recommend use of `tests/e2e/fixtures/enabled-test/enabled` for this).

**Integration Requirements:**
- Connect to existing storage service to retrieve comments for current page
- Integrate with the BC icon state management from Task 2.1
- Ensure sidebar works with the feedback package system from Task 2.2
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
- Sidebar state persists across page reloads
- All e2e tests pass and verify the described functionality

**Specify Deliverables:**
1. Updated sidebar UI component with toggle functionality
2. Toolbar implementation with capture and export buttons
3. Capture mode interaction handling with cancel functionality
4. Comment list display with proper formatting
5. localStorage integration for state persistence
6. Updated e2e tests that verify all sidebar functionality
7. Console logging of element details during capture mode

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