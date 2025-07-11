# Data Persistence and Local Database Design for BackChannel

## 1. Purpose and Roles

BackChannel uses local data persistence to support the collection and review of user feedback across HTML documents. All data is stored locally in the user’s browser using IndexedDB, ensuring:

- Data remains available across page refreshes and navigation between document pages.
- Comments are grouped by document set and retained until explicitly deleted.
- No server-side communication is required; data is exported manually.

Two distinct roles interact with the system:

- **Reviewers**, in `Capture` mode, add comments during their review process.
- **Editors**, in `Review` mode, load those comments and work through them to resolution.

## 2. Data Structure

Feedback is stored as structured comments associated with a specific document set.

### Capture Mode (`CaptureComment`)
Each comment contains:

- `id`: Unique identifier, derived from timestamp at creation  
- `text`: Comment content  
- `pageUrl`: Absolute URL of the page on which the comment was made  
- `timestamp`: Time the comment was created  
- `location`: An XPath string pointing to the DOM element the comment refers to  
- `snippet` (optional): A short snippet of text within the target element that the comment refers to — useful for identifying specific phrases within long paragraphs  
- `author`: (optional) Reviewer initials or short name  

In addition, the overall database stores metadata for the document under review:

- `documentTitle`
- `documentRootUrl` (shared URL prefix for the document set)

### Review Mode (`ReviewComment`)
In review mode, comments are extended with additional fields:

- `state`: Status (e.g., `open`, `accepted`, `rejected`, `resolved`)
- `editorNotes`: Optional notes from the editor
- `reviewedBy`: Initials or short name of the editor who handled the comment
- `reviewedAt`: Timestamp of when the comment was reviewed

The schema explicitly supports extending `CaptureComment` into `ReviewComment` via TypeScript typing, ensuring structured evolution and compatibility.

## 3. Storage Mechanism

- Data is stored in **IndexedDB**, using one database per document under review.
- A single document may span multiple pages; all pages under the same root URL share a database.
- Each database includes a `comments` store (array of feedback comments) and a `metadata` entry (document title and root path).
- Data is persisted as soon as a comment is added or saved.

## 4. Comment Lifecycle

| Phase           | Trigger                      | Action                                           |
|----------------|------------------------------|--------------------------------------------------|
| Create          | User submits new comment      | Comment is stored immediately with timestamp UID |
| Edit            | User modifies existing comment| Changes saved on submit                          |
| Delete          | User requests deletion        | Confirmation required before removal             |
| Export          | User finishes review          | Comments exported to CSV manually                |
| Import          | Editor loads CSV              | Comments loaded into review-mode database        |
| Resolve         | Editor marks review status    | Updated fields saved in database                 |

## 5. Export and Import

- Export is performed manually by the reviewer, generating a **CSV** file of all comments.
- This file is transmitted to the editor (e.g., via email, Teams).
- The editor uses the BackChannel plugin to **import** the CSV into a new or existing IndexedDB database for review.
- Comments imported in this way are enriched with review-specific fields.

## 6. Identifiers and Scoping

- Each comment is assigned a unique ID at creation, based on timestamp.
- Document scope is defined by a root URL and title, ensuring comments from different documents are kept separate.
- One IndexedDB database exists **per document set**, allowing multiple reviews to co-exist in the browser.

## 7. Deletion and Expiry

- Comments may be deleted individually via the UI, but only after a confirmation dialog.
- No automatic expiry, purging, or cleanup occurs.
- Data remains persistent until manually deleted by the user.
