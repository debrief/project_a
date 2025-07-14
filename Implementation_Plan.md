# BackChannel Implementation Plan

## Project Overview

**BackChannel** is a lightweight JavaScript plugin for capturing and reviewing feedback on static web content, particularly designed for offline or air-gapped environments in military settings. It supports feedback workflows across single and multi-page document sets.

### Key Features
- **Capture Mode**: Allows document consumers/reviewers to select content and submit feedback
- **Review Mode**: Enables document authors to load and manage feedback via CSV packages
- **Offline Operation**: Fully functional without network connectivity
- **Cross-Page Support**: Maintains feedback context across multiple pages

## Memory Bank Structure

Based on the project's complexity and multi-phase nature, a **directory-based Memory Bank** (`/Memory/`) is recommended. This structure will allow for better organization of logs by phases and tasks, making it easier to track progress and maintain context throughout the development process.

## Implementation Phases

### Phase 1: Project Setup & Infrastructure (Agent: Setup Specialist)

**Objective**: Establish the project foundation, build process, and core architecture.

#### Task 1.1: Project Scaffolding
- **Description**: Set up the initial project structure with TypeScript, Vite, ESLint, and Prettier
- **Assigned to**: Setup Specialist
- **Action Steps**:
  1. Initialize project with yarn
  2. Configure TypeScript and Vite
  3. Set up ESLint and Prettier with appropriate rules
  4. Create project directory structure
  5. Configure build process for single-file output
  6. Set up Jest and Playwright for testing
  7. Create root-level `index.html` containing welcome content.
  8. Provide initial Jest and Playwright tests that verify welcome page is being served correctly.
  9. Configure husky for pre-commit hooks to run linter and tests
- **Guiding Notes**: Use Vite for bundling, configure for ES5-compatible output, ensure UMD/IIFE format

#### Task 1.2: Core Types & Interfaces
- **Description**: Define the TypeScript interfaces and types for the application
- **Assigned to**: Setup Specialist
- **Action Steps**:
  1. Define Comment, FeedbackPackage, and PageMetadata interfaces
  2. Create enums for feedback states and modes
  3. Define plugin configuration interface
  - **Guiding Notes**: Focus on type safety and comprehensive documentation of interfaces

#### Task 1.3: Storage Service Implementation
- **Description**: Create the IndexedDB wrapper for data persistence
- **Assigned to**: Setup Specialist
- **Action Steps**:
  1. Implement IndexedDB initialization and connection management
  2. Create CRUD operations for feedback packages and comments
  3. Implement localStorage caching of database id and document URL root, to quickly determine if a newly loaded page already has a feedback page.
  4. Create utility that seeds JSON data into IndexedDB for later UI testing, according to `docs/project/pre-populate-database.md`
  5. Constructor should take optional fakeIndexedDb parameter.  In unit testing a fake indexedDb is provided, removing need to mock browser implementation. When provided, the fakeIndexedDb is used instead of browser IndexedDb
  6. Add error handling and fallbacks. Use the fake indexedDb for unit testing of the storage service.  Use console logging of database access outcomes to verify seeding of browser database in playwright e2e testing.
  - **Guiding Notes**: Use IndexedDB for primary storage, localStorage for caching of database id and document URL root, implement version checking

### Phase 2: Capture Mode - Core Functionality (Agent: UI Developer)

**Objective**: Implement the basic feedback capture functionality.

#### Task 2.1: Plugin Initialization & Icon
- **Description**: Create the entry point and BC icon functionality, included seeding database
- **Assigned to**: UI Developer
- **Action Steps**:
  1. Implement main plugin initialization after window.onload
  2. Extend example index.html to handle seeding of database using `fakeData.ts`
  3. Create BC icon with active/inactive states
  4. Add icon positioning and styling
  5. Implement click handlers for icon
  6. Hook into page load to seed demo data if needed
  7. Update e2e tests to verify BC icon is present and functional
  - **Guiding Notes**: Icon should be positioned top-right, use SVG for icon, handle window resize events

#### Task 2.2: Feedback Package Creation
- **Description**: Implement the dialog for creating a new feedback package
- **Assigned to**: UI Developer
- **Action Steps**:
  1. Create modal dialog UI for package creation
  2. Implement form for document title, author name, URL prefix
  3. Add validation and error handling
  4. Connect to storage service for saving package data
  5. Update e2e tests to verify package creation functionality
  - **Guiding Notes**: Modal should be accessible, form should validate inputs, provide clear feedback on success/failure

#### Task 2.3: Capture Sidebar
- **Description**: Implement the sidebar for managing feedback capture
- **Assigned to**: UI Developer
- **Action Steps**:
  1. Create sidebar UI with toggle functionality
  2. Implement "Capture Feedback" and "Export" buttons
  3. On "Capture Feedback", sidebar hidden, allowing reviewer to select element of content. Once clicked, sidebar returns.  A `Cancel selection` button is shown to top-right.
  3. Add comment list display in sidebar
  4. Implement sidebar state persistence
  5. Update e2e tests to verify sidebar functionality, and that seeded database comments are displayed
  - **Guiding Notes**: Sidebar should be collapsible, use CSS transitions for smooth animations, persist state in localStorage

#### Task 2.4: Element Selection & Highlighting
- **Description**: Implement the functionality to select and highlight elements for feedback
- **Assigned to**: UI Developer
- **Action Steps**:
  1. Add hover highlighting for page elements
  2. Implement click handling for element selection
  3. Create element identification and path generation
  4. Add cancel functionality for capture mode
  - **Guiding Notes**: Use event delegation for performance, generate unique selectors for elements, handle edge cases like nested elements

#### Task 2.5: Comment Creation UI
- **Description**: Create the UI for adding comments to selected elements
- **Assigned to**: UI Developer
- **Action Steps**:
  1. Implement comment form in sidebar
  2. Add validation and submission handling
  3. Connect to storage service for saving comments
  4. Implement comment badges on elements
  - **Guiding Notes**: Form should be compact but usable, provide clear feedback on submission, badges should be visible but not intrusive

### Phase 3: Persistence & Navigation (Agent: Backend Developer)

**Objective**: Implement data persistence and cross-page navigation features.

#### Task 3.1: Comment Persistence
- **Description**: Ensure comments persist across page reloads
- **Assigned to**: Backend Developer
- **Action Steps**:
  1. Enhance storage service to handle page reload scenarios
  2. Implement loading of existing comments on page load
  3. Add comment badge restoration
  4. Optimize IndexedDB operations for performance
  - **Guiding Notes**: Use efficient querying patterns, implement caching where appropriate, handle edge cases like deleted elements

#### Task 3.2: Cross-Page Navigation
- **Description**: Implement support for comments across multiple pages
- **Assigned to**: Backend Developer
- **Action Steps**:
  1. Enhance storage to associate comments with specific pages
  2. Implement detection of feedback package matches on linked pages
  3. Add visual indicators for pages with comments
  4. Create navigation helpers for cross-page comment viewing
  - **Guiding Notes**: Store page URLs with comments, use URL normalization to handle variations, consider relative vs absolute paths

#### Task 3.3: CSV Export
- **Description**: Implement the CSV export functionality
- **Assigned to**: Backend Developer
- **Action Steps**:
  1. Create CSV generation logic for feedback packages
  2. Implement document metadata section in CSV
  3. Add comment data formatting for CSV
  4. Create download mechanism for CSV files
  - **Guiding Notes**: Follow the CSV schema defined in tech-overview.md, ensure human-readable format, handle special characters properly

### Phase 4: Review Mode (Agent: Full Stack Developer)

**Objective**: Implement the review mode functionality for document authors.

#### Task 4.1: Review Mode Initialization
- **Description**: Implement the switch to review mode and its initialization
- **Assigned to**: Full Stack Developer
- **Action Steps**:
  1. Add mode switching functionality
  2. Implement review mode detection on page load
  3. Create UI indicators for active mode
  4. Enhance storage service to handle review mode data
  - **Guiding Notes**: Mode should be persisted in localStorage, provide clear visual distinction between modes

#### Task 4.2: CSV Import
- **Description**: Implement the functionality to import feedback from CSV
- **Assigned to**: Full Stack Developer
- **Action Steps**:
  1. Create file input and handling for CSV upload
  2. Implement CSV parsing logic
  3. Add validation and error handling for CSV format
  4. Connect to storage service for importing comments
  - **Guiding Notes**: Handle malformed CSV gracefully, provide clear feedback on import success/failure, validate CSV structure

#### Task 4.3: Comment Linking & Navigation
- **Description**: Implement linking between comments and DOM elements in review mode
- **Assigned to**: Full Stack Developer
- **Action Steps**:
  1. Create mapping between imported comments and DOM elements
  2. Implement graceful handling of missing elements
  3. Add navigation to comment sources
  4. Create visual indicators for linked comments
  - **Guiding Notes**: Generate fallback display for missing elements, optimize element lookup performance

#### Task 4.4: Resolution Management
- **Description**: Implement functionality to mark comments as resolved/reopened
- **Assigned to**: Full Stack Developer
- **Action Steps**:
  1. Add resolution status to comment data model
  2. Implement UI for changing resolution status
  3. Update sidebar badges and styling based on status
  4. Enhance CSV export to include resolution information
  - **Guiding Notes**: Use clear visual indicators for resolution status, ensure status changes are immediately reflected in UI

### Phase 5: Polish & Quality Assurance (Agent: QA Specialist)

**Objective**: Refine the UI, handle edge cases, and ensure quality across browsers.

#### Task 5.1: UI Polish
- **Description**: Improve the visual design and usability of the plugin
- **Assigned to**: QA Specialist
- **Action Steps**:
  1. Add sort/filter controls to sidebar
  2. Improve badge contrast and click areas
  3. Enhance comment highlighting
  4. Refine animations and transitions
  - **Guiding Notes**: Focus on accessibility, ensure consistent styling across browsers, optimize for readability

#### Task 5.2: Error Handling & Edge Cases
- **Description**: Implement comprehensive error handling and edge case management
- **Assigned to**: QA Specialist
- **Action Steps**:
  1. Add warnings for missing or malformed CSV imports
  2. Implement graceful handling of IndexedDB failures
  3. Add detection and handling of invalid feedback packages
  4. Create logging for errors and skipped operations
  - **Guiding Notes**: Provide user-friendly error messages, implement fallbacks where possible, log detailed errors for debugging

#### Task 5.3: Cross-Browser Testing
- **Description**: Test and ensure compatibility across recent browsers
- **Assigned to**: QA Specialist
- **Action Steps**:
  1. Test in Chrome, Firefox, Safari, and Edge
  2. Verify functionality with file:// protocol
  3. Test in air-gapped environments
  4. Document any browser-specific issues or workarounds
  - **Guiding Notes**: Focus on recent browser versions as specified, test both online and offline scenarios

#### Task 5.4: Documentation & Packaging
- **Description**: Create user documentation and prepare for distribution
- **Assigned to**: QA Specialist
- **Action Steps**:
  1. Write end-user guide for Capture and Review modes
  2. Document CSV format and metadata
  3. Create embed/install instructions
  4. Prepare final build with minification
  - **Guiding Notes**: Documentation should be clear and concise, include examples where helpful, ensure build process produces optimized output

## Development Workflow & Quality Assurance

### Git Commit Strategy
- Commits should be made after completion of each task in the Implementation Plan
- Each commit should include a descriptive message referencing the completed task
- Code should be reviewed before committing to ensure quality and adherence to requirements

### Testing Strategy
- Each task should include appropriate tests to verify functionality
- Testing frameworks: Jest for unit tests, Playwright for end-to-end tests
- Tests should be run before each commit using husky pre-commit hooks
- Test coverage should be maintained throughout development

## Dependencies & Constraints

- **Technical Stack**: TypeScript, Vite, ESLint, Prettier, yarn, Jest, Playwright
- **Browser Support**: Recent browsers only
- **Deployment**: Single-file JS with self-injecting CSS
- **Offline Operation**: No network dependencies
- **Package Management**: yarn
- **Version Control**: Git with regular commits after task completion
- **Quality Assurance**: Automated testing to prevent regression errors

## Memory Bank Note

This implementation plan is associated with a directory-based Memory Bank structure (`/Memory/`), organized by phases and tasks to facilitate efficient tracking and context maintenance throughout the project.
