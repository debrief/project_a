# APM Task Assignment: Storage Service Implementation

## 1. Agent Role & APM Context

**Introduction:** You are activated as an Implementation Agent within the Agentic Project Management (APM) framework for the BackChannel project.

**Your Role:** As an Implementation Agent, you are responsible for executing assigned tasks diligently and logging your work meticulously to maintain project continuity and quality.

**Workflow:** You will receive specific task assignments from the Manager Agent (via the User) and must document all work in the Memory Bank for future reference and handoffs.

## 2. Task Assignment

**Reference Implementation Plan:** This assignment corresponds to `Phase 1, Task 1.3: Storage Service Implementation` in the Implementation_Plan.md.

**Objective:** Create the IndexedDB wrapper for data persistence, including database initialization, CRUD operations, minimal localStorage caching of identifiers, demo data seeding utility, and comprehensive error handling.

**Detailed Action Steps:**

1. **Implement IndexedDB initialization and connection management**
   - Create a DatabaseService class that handles IndexedDB database creation and version management
   - Implement database schema setup with object stores for comments and metadata
   - Add connection pooling and error recovery mechanisms

2. **Create CRUD operations for feedback packages and comments**
   - Implement methods for storing, retrieving, updating, and deleting CaptureComment objects
   - Add operations for DocumentMetadata management
   - Ensure all operations use the TypeScript interfaces from Task 1.2 (CaptureComment, DocumentMetadata, StorageInterface)

3. **Implement localStorage caching of database id and document URL root**
   - **Guidance:** Use localStorage for caching of database id and document URL root, to quickly determine if a newly loaded page already has a feedback page
   - Store minimal metadata in localStorage to avoid repeated IndexedDB queries for basic page identification
   - Focus on caching only essential identifiers, not full data sets

4. **Create utility that seeds JSON data into IndexedDB for later UI testing**
   - **Guidance:** Follow the requirements in `docs/project/pre-populate-database.md` for versioned seeding
   - Implement `seedDemoDatabaseIfNeeded()` function that checks localStorage for seed version
   - Use the existing `tests/e2e/fixtures/enabled-test/fakeData.ts` structure as reference
   - Support `window.demoDatabaseSeed` format with version string and database definitions
   - Only seed if version is not yet present in localStorage, preventing data loss

5. **Constructor should take optional fakeIndexedDb parameter**
   - **Guidance:** For unit testing, accept a fake IndexedDB implementation to remove need for browser mocking
   - When fakeIndexedDb is provided, use it instead of browser IndexedDB
   - Ensure the fake implementation follows the same interface as real IndexedDB

6. **Add error handling and fallbacks**
   - **Guidance:** Use console logging of database access outcomes to verify seeding in Playwright e2e testing
   - Implement comprehensive error handling for IndexedDB failures
   - Create fallback mechanisms when IndexedDB is unavailable
   - Add detailed logging for debugging database operations

**Provide Necessary Context/Assets:**
- The simplified TypeScript interfaces are available in `src/types/index.ts`
- Reference the seeding requirements in `docs/project/pre-populate-database.md`
- Use the existing fake data structure from `tests/e2e/fixtures/enabled-test/fakeData.ts`
- Ensure compatibility with the StorageInterface defined in the types

## 3. Expected Output & Deliverables

**Define Success:** Successful completion requires a fully functional DatabaseService that:
- Handles IndexedDB operations reliably with proper error handling
- Implements minimal localStorage caching of database id and document URL root
- Supports versioned demo data seeding without data loss
- Works with both real and fake IndexedDB for testing
- Passes all unit tests and integrates properly with existing types

**Specify Deliverables:**
1. `src/services/DatabaseService.ts` - Main database service implementation
2. `src/utils/seedDemoDatabase.ts` - Demo data seeding utility
3. Updated unit tests in `tests/unit/` covering all database operations
4. Console logging implementation for e2e test verification
5. Updated build output that includes the new storage functionality

**Format:** TypeScript code following existing project conventions, with comprehensive JSDoc documentation and proper error handling.

## 4. Memory Bank Logging Instructions (Mandatory)

Upon successful completion of this task, you **must** log your work comprehensively to the project's `Memory_Bank.md` file.

**Format Adherence:** Adhere strictly to the established logging format in the Memory Bank directory structure. Ensure your log includes:
- A reference to Task 1.3 in Phase 1 of the Implementation Plan
- A clear description of the actions taken and architecture decisions
- Code snippets for key implementations (DatabaseService class structure, seeding utility)
- Any key decisions made regarding IndexedDB schema, minimal caching approach, or error handling
- Confirmation of successful execution including test results and build verification
- Documentation of the seeding mechanism and how it prevents data loss

## 5. Clarification Instruction

If any part of this task assignment is unclear, please state your specific questions before proceeding. Pay particular attention to the seeding requirements and ensure you understand the versioning mechanism to prevent user data loss.