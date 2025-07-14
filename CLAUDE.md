# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BackChannel** is a lightweight, offline-first JavaScript plugin for capturing and reviewing feedback within static HTML content. It is designed for disconnected environments where network access is unavailable or restricted (particularly military/air-gapped environments).

The project uses the **Agentic Project Management (APM)** framework, which coordinates specialized AI agents through a Memory Bank system organized in `/Memory/` directories by implementation phases.

## Key Technologies & Build System

- **Language**: TypeScript compiled to ES6 JavaScript
- **Build System**: Vite (for development) and Vite bundler (for plugin output)
- **Package Manager**: yarn
- **Testing**: Vitest for unit tests, Playwright for integration/E2E tests
- **Linting**: ESLint + Prettier
- **UI Library**: Lit (https://lit.dev/) for creating web components
- **Storage**: IndexedDB for primary persistence, localStorage for caching

## Common Development Commands

```bash
# Build the plugin for distribution
yarn build-plugin

# Run development server
yarn dev

# Run tests
yarn test                # Unit tests only
yarn test:integration    # Integration tests only  
yarn test:all           # All tests

# Linting and formatting
yarn lint
yarn format
```

## Project Structure & Architecture

### Core Architecture
The plugin is built as a single JavaScript file (`dist/backchannel.js`) that exposes a global `BackChannel` object. The architecture follows a service-oriented pattern:

- **Entry Point**: `src/index.ts` - Main plugin initialization
- **DOM Management**: `src/dom.ts` - Element selection, highlighting, and annotations
- **Storage**: `src/storage.ts` - IndexedDB wrapper with localStorage caching
- **Export**: `src/exporter.ts` - CSV generation and download functionality
- **UI**: `src/ui.ts` - Feedback panel and UI components using Lit
- **Types**: `src/types.ts` - TypeScript interfaces and type definitions

### Plugin Modes
The plugin operates in two distinct modes:
1. **Capture Mode**: Allows document reviewers to select elements and submit feedback
2. **Review Mode**: Enables document authors to import and manage feedback via CSV

### Key Features
- **Offline Operation**: Fully functional without network connectivity
- **Cross-Page Support**: Maintains feedback context across multiple pages
- **Element Selection**: Hover highlighting and click selection for feedback target elements
- **CSV Export/Import**: Human-readable feedback packages for air-gapped environments
- **Persistence**: Comments persist across page reloads using IndexedDB

## Implementation Plan Structure

The project follows a 5-phase implementation plan defined in `Implementation_Plan.md`:

1. **Phase 1**: Project Setup & Infrastructure (Setup Specialist)
2. **Phase 2**: Capture Mode Core Functionality (UI Developer)  
3. **Phase 3**: Persistence & Navigation (Backend Developer)
4. **Phase 4**: Review Mode (Full Stack Developer)
5. **Phase 5**: Polish & Quality Assurance (QA Specialist)

Each phase has specific tasks with assigned agent types and detailed action steps.

## Memory Bank System

The project uses a directory-based Memory Bank (`/Memory/`) organized by phases and tasks:
- Each phase has its own directory (e.g., `/Memory/Phase_2_Capture_Mode_Core/`)
- Each task has a dedicated subdirectory for tracking progress and context
- Memory logs follow the format defined in `prompts/02_Utility_Prompts_And_Format_Definitions/Memory_Bank_Log_Format.md`

## Testing Strategy

- **Unit Tests**: Located in `tests/unit/` using Vitest
- **Integration Tests**: Located in `tests/e2e/` using Playwright  
- **File Naming**: Unit tests use `.test.js/.test.ts`, integration tests use `.spec.js/.spec.ts`
- **Test Data**: Seeding utility in `src/services/storage/` for populating test data
- **Pre-commit Hooks**: Husky runs linter and tests before commits

## Build Output

The build process generates:
- `dist/backchannel.js` - Main plugin file (IIFE format, unminified for readability)
- `dist/backchannel.js.map` - Source maps for debugging
- Global `BackChannel` object exposed for initialization

## CSV Export Schema

The plugin exports feedback in a structured CSV format with:
- **Document Metadata**: Title, URL, Document ID, Reviewer
- **Comment Data**: Element Label, Comment Text, Timestamp, Resolution Status

## Storage Architecture

- **Primary Storage**: IndexedDB for persistent data across sessions
- **Caching Layer**: localStorage for performance optimization
- **Namespacing**: Storage keys based on document/manual configuration
- **CRUD Operations**: Full create, read, update, delete operations for comments and feedback packages

## Development Workflow

- Git commits should be made after completion of each task in the Implementation Plan
- Each commit should reference the completed task number and description
- Code should be reviewed for quality and adherence to requirements before committing
- The APM framework emphasizes structured handovers between agents when context limits are reached