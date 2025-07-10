# BackChannel Project Memory Bank

This Memory Bank serves as the central repository for all project-related information, decisions, code snippets, and agent outputs for the BackChannel project. It is organized by phases and tasks as defined in the Implementation Plan.

## Structure

The Memory Bank is organized into directories corresponding to the main phases of the project:

- **Phase_1_Setup_Infrastructure**: Project scaffolding, core types, and storage service implementation
- **Phase_2_Capture_Mode_Core**: Plugin initialization, feedback package creation, and capture functionality
- **Phase_3_Persistence_Navigation**: Comment persistence, cross-page navigation, and CSV export
- **Phase_4_Review_Mode**: Review mode initialization, CSV import, and comment management
- **Phase_5_Polish_QA**: UI polish, error handling, testing, and documentation

Each phase directory contains task-specific log files that document the implementation process, decisions, code snippets, and outcomes for each task.

## Log Format

All log entries follow the standard APM Memory Bank log format, which includes:

- **Date and Time**: When the entry was made
- **Agent**: Which agent made the entry
- **Type**: The type of entry (e.g., Implementation, Decision, Question, Review)
- **Content**: The actual log content, which may include code snippets, explanations, or other relevant information

## Usage Guidelines

1. **Implementation Agents**: When working on a task, document your process, decisions, and outcomes in the corresponding task log file.
2. **Code Snippets**: Include relevant code snippets with proper formatting and explanations.
3. **Cross-References**: When referencing other tasks or logs, include clear references to those locations.
4. **Decisions**: Clearly document any significant decisions made during implementation, including alternatives considered and rationale.

## Project Overview

BackChannel is a lightweight JavaScript plugin for capturing and reviewing feedback on static web content, particularly designed for offline or air-gapped environments in military settings. It supports feedback workflows across single and multi-page document sets.

For more detailed information about the project, refer to the Implementation_Plan.md file at the root of the project.
