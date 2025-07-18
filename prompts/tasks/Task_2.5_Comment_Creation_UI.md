# APM Task Assignment: Comment Creation UI

## 1. Agent Role & APM Context

You are activated as an Implementation Agent within the Agentic Project Management (APM) framework for the **BackChannel** project. Your role is to execute assigned tasks diligently and log your work meticulously. You will interact with the Manager Agent (via the User) and contribute to the Memory Bank system to maintain project context and continuity.

## 2. Onboarding / Context from Prior Work

Previous UI Developer agents have successfully established the foundation for the capture mode functionality:

- **Task 2.1**: Plugin initialization with BC icon functionality and database seeding capability
- **Task 2.2**: Feedback package creation modal with form validation and storage integration
- **Task 2.3**: Capture sidebar with toggle functionality, toolbar buttons, and comment list display
- **Task 2.4**: Element selection and highlighting system with hover effects and click handling

The current state includes a functional sidebar that can enter capture mode, allowing users to select elements on the page. When an element is selected, the system generates element identification data and logs it to the console. The sidebar returns after element selection, providing the foundation for the comment creation workflow you will now implement.

## 3. Task Assignment

**Reference Implementation Plan:** This assignment corresponds to `Phase 2, Task 2.5: Comment Creation UI` in the Implementation Plan.

**Objective:** Create the UI for adding comments to selected elements, including form implementation, storage integration, visual feedback through badges and background shading.

**Detailed Action Steps:**

1. **Implement Comment Form in Sidebar**
   - Create a compact but usable comment form that appears in the sidebar after element selection
   - Include fields for comment text (required) and optional metadata
   - Ensure form is accessible and follows the project's UI patterns established in previous tasks
   - Add form validation to ensure comment text is provided and meets minimum requirements

2. **Add Validation and Submission Handling**
   - Implement client-side validation for required fields and character limits
   - Create submission handling logic that processes the form data
   - Provide clear feedback on submission success or failure
   - Handle edge cases like empty comments or submission errors gracefully

3. **Connect to Storage Service for Saving Comments**
   - Integrate with the existing storage service (established in Phase 1) to persist comments
   - Ensure comments are associated with the correct feedback package and page
   - Include element identification data from the selection process in the comment record
   - Handle storage failures with appropriate error messaging

4. **Implement Comment Badges on Elements**
   - Create visual badges that appear on elements with comments
   - Badges should be visible but not intrusive to the document content
   - Position badges consistently and handle potential overlapping with page content
   - Ensure badges are clickable and provide access to comment details

5. **Add Subtle Background Shading to Elements with Comments**
   - Apply subtle background shading to elements that have comments attached
   - Shading should be subtle and not interfere with content readability
   - Ensure shading works across different element types and existing styles
   - Consider contrast and accessibility requirements for the shading

**Provide Necessary Context/Assets:**
- Reference the storage service interface established in Phase 1, Task 1.3
- Use the TypeScript interfaces defined in Phase 1, Task 1.2 for type safety
- Follow the existing UI patterns from the sidebar and modal implementations
- Ensure compatibility with the element selection system from Task 2.4

## 4. Expected Output & Deliverables

**Define Success:** The comment creation system is fully functional, allowing users to add comments to selected elements with proper validation, storage, and visual feedback.

**Specify Deliverables:**
- Modified sidebar UI to include comment form functionality
- Comment submission and validation logic
- Storage integration for comment persistence
- Visual badge system for elements with comments
- Subtle background shading implementation for commented elements
- Updated e2e tests to verify comment creation workflow

**Format:** All code should follow the project's TypeScript conventions, use the established UI patterns, and integrate seamlessly with existing functionality.

## 5. Memory Bank Logging Instructions

Upon successful completion of this task, you **must** log your work comprehensively to the project's Memory Bank system following the directory-based structure (`/Memory/Phase_2_Capture_Mode_Core/Task_2.5_Comment_Creation_UI/`).

**Format Adherence:** Adhere strictly to the established logging format as defined in `prompts/02_Utility_Prompts_And_Format_Definitions/Memory_Bank_Log_Format.md`. Ensure your log includes:
- A reference to Phase 2, Task 2.5 in the Implementation Plan
- A clear description of the actions taken for each component (form, validation, storage, badges, shading)
- Any key decisions made regarding UI patterns, positioning, or styling approaches
- Code snippets for the main comment creation workflow
- Any challenges encountered and how they were resolved
- Confirmation of successful execution including test results

## 6. Clarification Instruction

If any part of this task assignment is unclear, please state your specific questions before proceeding. Pay particular attention to integration points with existing systems and any assumptions about UI behavior or styling requirements.