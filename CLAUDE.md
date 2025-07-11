# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Testing

- `npm run build` - Build the plugin using Vite (outputs to `dist/` as UMD module)
- `npm run build-plugin` - Alternative build command (same as build)
- `npm test` - Run Jest tests in jsdom environment
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run lint` - Run ESLint on TypeScript files in src/
- `npm run format` - Format code using Prettier
- `npm run dev` - Start Vite development server

### Test Configuration

- Jest config uses jsdom environment with ts-jest preset
- Tests located in `**/tests/**/*.test.ts` pattern
- E2E tests use Playwright configuration

## Project Architecture

This is "BackChannel" - a JavaScript plugin for capturing and reviewing feedback on static web content in offline environments. The project follows a layered architecture:

### Core Types (`src/types/index.ts`)

- `FeedbackPackage` - Complete feedback package with metadata and comments
- `ReviewComment` - Comments with review states (open, accepted, rejected, resolved)
- `CaptureComment` - Comments created in capture mode
- `CommentState` enum and `PluginMode` enum (Capture/Review modes)
- `BackChannelConfig` - Plugin configuration options

### Storage Layer (`src/services/storage/`)

- **StorageService** - Main service coordinating database and cache operations
- **DatabaseService** - IndexedDB operations for persistent storage
- **CacheService** - localStorage operations for caching
- **SeedDataService** - Test data seeding functionality
- Storage generates deterministic database names based on document URL and package ID

### Plugin Entry Point (`src/index.ts`)

- Main BackChannel class with minimal implementation
- Global window.BackChannel object for browser usage
- Configurable with target selectors, storage keys, and UI positioning

### Project Management Structure

The project uses an Agentic Project Management (APM) framework with:

- Detailed implementation plans in `Memory/` directory
- Phase-based task organization (Phase 1-5)
- Comprehensive task logging and memory bank system
- Manager and Implementation agent coordination

### Key Features

- **Dual Mode Operation**: Capture mode for creating feedback, Review mode for managing it
- **Offline First**: Uses IndexedDB for persistent local storage
- **XPath-based Element Targeting**: Comments linked to DOM elements via XPath
- **CSV Export/Import**: Feedback packages can be exported and imported
- **Cross-page Navigation**: Comments persist across page navigation within document sets

### Development Notes

- Built as UMD module targeting browser environments
- TypeScript with strict configuration
- Uses Vite for building, Jest for unit tests, Playwright for E2E
- Currently in early implementation phase (Task 1.1-1.3 completed)
