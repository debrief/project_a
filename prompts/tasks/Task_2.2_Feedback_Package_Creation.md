# Task Assignment Prompt: Task 2.2 - Feedback Package Creation

## Task Overview
**Task**: 2.2 - Feedback Package Creation  
**Phase**: Phase 2 - Capture Mode Core Functionality  
**Agent Role**: UI Developer  
**Estimated Complexity**: Medium  

## Task Description
Implement the dialog for creating a new feedback package, which is the first step in the feedback capture workflow. This task creates the modal interface that allows reviewers to set up a new feedback session by defining document metadata.

## Detailed Requirements

### Core Functionality
1. **Modal Dialog UI**: Create a modal dialog that appears when users need to create a new feedback package
2. **Form Implementation**: Build a form with fields for:
   - Document title (text input, required)
   - Author/reviewer name (text input, required) 
   - URL prefix (text input, required, used for multi-page support, defaults to parent folder of current document)
3. **Validation & Error Handling**: Add client-side validation with clear error messages
4. **Storage Integration**: Connect form submission to DatabaseService for saving package metadata
5. **User Experience**: Provide clear feedback on success/failure of package creation

### Technical Specifications

#### Modal Dialog Requirements
- Modal should be accessible (ARIA labels, keyboard navigation, focus management)
- Should overlay the current page content with a backdrop
- Include close button (X) and cancel/submit action buttons
- Escape key should close modal
- Click outside modal should close modal (with confirmation if form has data)

#### Form Fields & Validation
```typescript
interface PackageCreationForm {
  documentTitle: string;     // Required, min 1 char, max 200 chars
  reviewerName: string;      // Required, min 1 char, max 100 chars
  urlPrefix: string;         // Required, valid URL format, defaults to parent folder of current document
}
```

#### URL Prefix Logic
- **Default Value**: Extract parent folder path from `window.location.href` (e.g., if current URL is `/docs/section1/page1.html`, default to `/docs/section1/`)
- **Purpose**: This prefix will automatically match all documents "beneath" the current document in the folder tree
- **User Override**: Users can modify the prefix if they want broader or narrower scope for the feedback package

#### Integration Points
- **DatabaseService**: Use existing `saveMetadata()` method to persist package data
- **Plugin State**: Update plugin state after successful package creation
- **UI Feedback**: Show success message and transition to capture-ready state

### Implementation Steps

1. **Create Modal Component** (`src/components/PackageCreationModal.ts`)
   - Modal container with backdrop
   - Form layout with proper accessibility
   - Event handlers for open/close/submit

2. **Form Validation Logic**
   - Real-time validation as user types
   - Clear error message display
   - Prevent submission with invalid data
   - Auto-populate URL prefix with parent folder of current document

3. **Database Integration**
   - Connect form submission to DatabaseService
   - Handle async operations with loading states
   - Error handling for database failures

4. **Update Plugin Architecture**
   - Add modal trigger to main plugin flow
   - Integrate with existing icon/sidebar components
   - Update state management for package creation workflow

5. **Testing Implementation**
   - Unit tests for modal component functionality
   - E2E tests for complete package creation workflow
   - Error handling test scenarios

### Files to Create/Modify

#### New Files
- `src/components/PackageCreationModal.ts` - Main modal component
- `src/styles/modal.css` - Modal-specific styling
- `tests/unit/PackageCreationModal.test.ts` - Unit tests

#### Files to Modify
- `src/index.ts` - Integrate modal into main plugin flow
- `src/components/BackChannelIcon.ts` - Add package creation trigger
- `tests/e2e/welcome-page.spec.ts` - Add E2E tests for package creation

### Acceptance Criteria

#### Functional Requirements
- [ ] Modal dialog appears when triggered from plugin UI
- [ ] All form fields validate correctly with appropriate error messages
- [ ] Valid form submission creates package metadata in DatabaseService
- [ ] Success message appears after successful package creation
- [ ] Modal closes automatically after successful submission
- [ ] Form data persists if user accidentally closes modal (with confirmation)

#### Technical Requirements
- [ ] Modal is fully accessible (keyboard navigation, screen readers)
- [ ] Component follows existing code patterns and TypeScript interfaces
- [ ] All new code has appropriate unit test coverage
- [ ] E2E tests verify complete package creation workflow
- [ ] Error scenarios are handled gracefully with user-friendly messages

#### Integration Requirements
- [ ] Integrates seamlessly with existing DatabaseService
- [ ] Updates plugin state appropriately after package creation
- [ ] Maintains consistency with existing UI components and styling
- [ ] Works correctly with existing icon and initialization flow

### Testing Requirements

#### Unit Tests (Jest/Vitest)
- Modal component creation and destruction
- Form validation logic for all fields
- Event handling (submit, cancel, escape key)
- Database service integration
- Error state management

#### E2E Tests (Playwright)
- Complete package creation workflow
- Form validation in browser environment
- Modal accessibility features
- Error handling with invalid inputs
- Integration with existing plugin features

### Dependencies & Context

#### Existing Components to Leverage
- `DatabaseService` - For metadata persistence
- `BackChannelIcon` - Potential trigger point for modal
- Existing CSS patterns in `src/styles/icon.css`

#### Current Plugin State
- Plugin initializes successfully with demo data seeding
- Icon component is functional with state management
- DatabaseService is fully implemented and tested
- All existing tests (29 unit, 11 E2E) are passing

### Success Metrics
- All existing tests continue to pass
- New package creation functionality works end-to-end
- UI is intuitive and accessible
- Code maintains high quality standards (linting, TypeScript compliance)
- Component is reusable and well-integrated with existing architecture

---

**Next Steps After Completion**: Task 2.2 completion enables Task 2.3 (Capture Sidebar), which will provide the main interface for managing feedback capture and displaying created packages.