# APM Task Assignment: Project Scaffolding for BackChannel

## 1. Agent Role & APM Context

You are activated as an Implementation Agent (Setup Specialist) within the Agentic Project Management (APM) framework for the BackChannel project. Your role is to execute assigned tasks diligently and log your work meticulously in the Memory Bank.

You will interact with the Manager Agent (via the User) and contribute to the Memory Bank to maintain project context and progress tracking. Your work is critical to establishing the foundation for the entire project.

## 2. Task Assignment

**Reference Implementation Plan:** This assignment corresponds to `Phase 1: Project Setup & Infrastructure, Task 1.1: Project Scaffolding` in the Implementation Plan.

**Objective:** Establish the project foundation, build process, and core architecture.

**Detailed Action Steps:**

1. Initialize project with yarn
   - Create a new directory for the project
   - Initialize with `yarn init`
   - Set up the package.json with appropriate metadata for the BackChannel plugin

2. Configure TypeScript and Vite
   - Install TypeScript and Vite as dev dependencies
   - Create tsconfig.json with appropriate settings for ES5-compatible output
   - Configure Vite for UMD/IIFE format output to generate a single JavaScript file

3. Set up ESLint and Prettier with appropriate rules
   - Install ESLint, Prettier, and related plugins
   - Configure ESLint to work with TypeScript
   - Set up Prettier with rules that match project requirements (e.g., single quotes for JavaScript strings)
   - Create appropriate configuration files (.eslintrc, .prettierrc)

4. Create project directory structure
   - Set up src/ directory with appropriate subdirectories (components/, utils/, etc.)
   - Create initial entry point file (index.ts)
   - Set up directory for tests

5. Configure build process for single-file output
   - Set up Vite configuration to output a single JavaScript file
   - Configure build to include source maps
   - Add build scripts to package.json

6. Set up Jest and Playwright for testing
   - Install Jest, Playwright, and related dependencies
   - Configure Jest for TypeScript testing
   - Set up Playwright for end-to-end testing
   - Create initial test configuration files

7. Create root-level `index.html` containing welcome content
   - Set up a basic HTML file for testing the plugin
   - Include necessary structure for plugin initialization
   - Add sample content that can be used for feedback capture

8. Provide initial Jest and Playwright tests
   - Create basic tests that verify the welcome page is being served correctly
   - Set up test infrastructure for future component testing

9. Configure husky for pre-commit hooks
   - Install husky and related dependencies
   - Set up pre-commit hooks to run linter and tests
   - Ensure hooks are properly configured to maintain code quality

## 3. Expected Output & Deliverables

**Define Success:** The task is complete when:
- The project structure is set up with all necessary configuration files
- The build process successfully generates a single JavaScript file
- Initial tests pass
- Pre-commit hooks are working correctly

**Specific Deliverables:**
1. Initialized project with proper package.json
2. TypeScript and Vite configuration files
3. ESLint and Prettier configuration files
4. Project directory structure with appropriate files
5. Build configuration for single-file output
6. Jest and Playwright test configurations
7. Root-level index.html with welcome content
8. Initial tests for the welcome page
9. Husky configuration for pre-commit hooks

## 4. Memory Bank Logging Instructions

Upon successful completion of this task, you **must** log your work comprehensively to the project's Memory Bank in the appropriate location: `/Memory/Phase_1_Setup_Infrastructure/Task_1.1_Project_Scaffolding/`.

Adhere strictly to the established logging format as defined in `prompts/02_Utility_Prompts_And_Format_Definitions/Memory_Bank_Log_Format.md`. Ensure your log includes:
- A reference to the assigned task in the Implementation Plan
- A clear description of the actions taken
- Any code snippets generated or modified
- Any key decisions made or challenges encountered
- Confirmation of successful execution (e.g., tests passing, output generated)

## 5. Clarification Instruction

If any part of this task assignment is unclear, please state your specific questions before proceeding.

## 6. Technical Requirements

- JavaScript package manager: yarn (required)
- Target audience: Military (offline/air-gapped environments)
- Browser support: Recent browsers only
- UI components: Built from scratch (no external libraries)
- Deployment: Single-file JS with self-injecting CSS
- Build system: Vite/TypeScript
- Data storage: IndexedDB with localStorage caching of database id and page root URL
