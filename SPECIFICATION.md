# The Journal Library - Complete System Specification

## 1. Executive Overview

**The Journal Library** is a lightweight, zero-backend, client-first web application designed with a **modern skeuomorphic physical bookshelf aesthetic**. It enables users to curate multi-level digital journals structured as **Libraries**, **Shelves**, **Books**, and **Pages**.

The application is engineered to be deployed as a static site directly to **GitHub Pages**, utilizing **Vue Vapor Mode** for zero-Virtual-DOM high-efficiency rendering and **GitHub as a Database** (via GitHub API & Repositories/Gists) for sovereign, serverless data storage with version history.

---

## 2. Information Architecture & Data Metaphor

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER (GitHub Account)                           │
│  - Authenticated via GitHub OAuth / Token (Zero external backend)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (1:N)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           LIBRARY (Vault)                              │
│  - Name, Description, Wood/Material Finish (Walnut, Oak, Mahogany)     │
│  - Shelf arrangement, Global theme, Repo / Gist mapping                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (1:N)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            SHELF (Category)                            │
│  - Name/Title (e.g., "Daily Reflections", "Work Sprints", "Fiction")   │
│  - Metallic Nameplate Style (Brass, Silver, Matte Black)               │
│  - Shelf Order & Book List                                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (1:N)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BOOK / JOURNAL (Volume)                         │
│  - Title, Spine Color, Spine Finish (Leather, Cloth, Foil, Modern)     │
│  - Title Typography & Foil Color (Gold, Silver, White, Copper)         │
│  - Ribbon Bookmark (Color & Active State)                              │
│  - Dynamic Physical Width (Calculated dynamically from page count)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (1:N)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                             BOOK PAGES                                 │
│  - Page Number, Timestamp, Page Title, Paper Texture (Lined, Parchment)│
│  - Rich Text Content (Headings, Checklists, Quotes, Code, Media)       │
│  - Mood / Sentiment indicator, Tags, Word Count, Autosave metadata     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Visual & Skeuomorphic Design Engine

### 3.1 The Physical Bookshelf View
- **Shelf Materials**: High-resolution procedural CSS/canvas wood textures (Dark Walnut, Natural Oak, Antique Mahogany, Nordic Birch, Midnight Lacquer) featuring ambient occlusion shadows and shelf-lip highlights.
- **Shelf Nameplates**: Screwed-in metallic label plates with engraved serif/sans typography (Brushed Brass, Polished Silver, Matte Black, Weathered Bronze).
- **Physical Book Spines**:
  - **Spine Color**: Full spectrum hex / curated vintage palette (e.g., Oxblood Red, Hunter Green, Deep Navy, Ochre Gold, Charcoal).
  - **Spine Finishes & Textures**:
    - `ribbed-leather`: Raised horizontal binding ribs with leather grain.
    - `gold-foil`: Ornate gold/silver filigree border embossing.
    - `woven-cloth`: Tactile linen/canvas fabric texture.
    - `modern-matte`: Clean, minimalist smooth book cloth.
    - `vintage-parchment`: Marble paper with aged patina.
  - **Title Foil & Typography**:
    - Title Colors: *Metallic Gold (`#FFD700`), Silver Leaf (`#E0E0E0`), Copper Bronze (`#CD7F32`), Crisp White, or Embossed Black*.
    - Fonts: *Playfair Display (Serif), Cinzel (Classic Roman), Fira Code (Technical), Caveat (Calligraphy), Inter (Modern)*.
  - **Ribbon Bookmarks**: Colored silk bookmark ribbon dangling below the shelf ledge for favorites or active journals.

### 3.2 Dynamic Book Thickness Formula
The visual width of a book on the shelf dynamically scales based on the number of written pages:

$$\text{Spine Width} = \operatorname{clamp}\left(W_{\min},\; W_{\text{base}} + (\text{Page Count} \times \Delta_{\text{page}}),\; W_{\max}\right)$$

- **Minimum Spine Width ($W_{\min}$)**: `28px` (ensures readability of vertical titles on fresh books).
- **Base Width ($W_{\text{base}}$)**: `32px`.
- **Page Growth Factor ($\Delta_{\text{page}}$)**: `1.5px` per written page (with logarithmic scaling after 50 pages).
- **Maximum Spine Width ($W_{\max}$)**: `110px` (keeps natural shelf proportions).
- **Page Edge Rendering**: When books exceed `48px` width, subtle stratified paper-edge lines appear on the exposed top edge.

### 3.3 The Reading Desk & Book-Opening Experience
- **Smooth 3D Perspective Transition**: Clicking a book smoothly glides it off the shelf using CSS 3D matrix transforms (`translate3d`, `rotateY`, `scale3d`) onto a focused writing desk.
- **Tactile Paper Surfaces**: Lined notebook paper, dotted grid, vintage parchment, clean dark slate.
- **Writing Modes**:
  - *Paginated Book Mode*: Two-page spread or single-page turn with page-flip animations.
  - *Distraction-Free Focus Mode*: Clean typewriter-style continuous writing.

---

## 4. Technical Architecture: Vue Vapor + GitHub as Database

```
┌────────────────────────────────────────────────────────────────────────┐
│              GitHub Pages (Static Hosting @ 0ms Server Cost)           │
│  - Built with Vite & Vue 3 (Vapor Mode)                                │
│  - Deployed automatically via GitHub Actions CI/CD                     │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │                                          │
               ▼ (Fast Local Reads/Writes)                ▼ (Cloud Sync & Storage)
┌──────────────────────────────────────┐ ┌──────────────────────────────────────┐
│       IndexedDB (Dexie.js)           │ │          GitHub API Engine           │
│  - 0ms local read/write latency      │ │  - User OAuth / Personal Access Token│
│  - Full offline writing capability   │ │  - Direct Git Commit Tree & Gist Sync│
│  - Optimistic UI updates             │ │  - Automated commit history & backups│
│  - Auto-sync debouncer               │ │  - Collaboration via GitHub Repos    │
└──────────────────────────────────────┘ └──────────────────────────────────────┘
```

### 4.1 Frontend Stack
- **Framework**: **Vue 3 (Vapor Mode)**
  - *Why Vapor Mode*: Compiles templates directly into imperative DOM operations without Virtual DOM overhead.
  - *Runtime Size*: **~12 KB gzipped** core runtime.
  - *Memory Footprint*: Extremely low garbage collection overhead; ideal for older mobile devices.
- **Build Tool**: **Vite** (Instant HMR, ES module bundling, tree-shaking).
- **State Management**: **Pinia** with persistent IndexedDB hydration.
- **Local Storage Layer**: **Dexie.js** (IndexedDB wrapper for instantaneous offline-first persistence).
- **Styling**: **Tailwind CSS v4** (Zero runtime CSS overhead, custom skeuomorphic shadow and gradient utilities).
- **Editor**: **Tiptap (Vue 3)** (Lightweight, modular block/rich-text editor with markdown shortcut support).
- **Icons**: **Lucide-Vue-Next** (Tree-shaken feather/lucide icons).

### 4.2 GitHub as Database Architecture

#### **1. Authentication Model**
- Users authenticate via:
  1. **GitHub OAuth Flow** (via lightweight static proxy/worker or GitHub OAuth App).
  2. **Personal Access Token (PAT)**: Stored securely in `localStorage`/IndexedDB with `repo` or `gist` scope.

#### **2. Repository Storage Structure**
Data is stored directly in a private/public repository (e.g. `my-journal-library`) or multi-file secret Gists:

```
my-journal-library/
├── library.json                          # Library config (name, theme, wood material, shelf list)
└── shelves/
    ├── 01_daily-reflections/
    │   ├── shelf.json                    # Shelf metadata (name, order, nameplate style)
    │   └── books/
    │       ├── 01_2026-journal/
    │       │   ├── book.json             # Book styling (spine color, style, title color, ribbon)
    │       │   └── pages/
    │       │       ├── page_001.json     # Page payload (title, timestamp, AST/markdown, mood, tags)
    │       │       ├── page_002.json
    │       │       └── page_003.json
    │       └── 02_travel-log/
    │           └── ...
    └── 02_creative-writing/
        └── ...
```

#### **3. Commit & Sync Strategy**
- **Optimistic Local-First Writes**: When a user writes a page, it saves to **IndexedDB in 0ms**.
- **Debounced Smart Commits**: Changes are grouped and committed to GitHub via the GitHub Git Trees API (`POST /repos/{owner}/{repo}/git/trees`) every 15–30 seconds after editing ceases, preventing rate limit congestion.
- **Meaningful Git History**: Every commit acts as a time-machine log (e.g., `"Updated Page 4 in '2026 Journal' [word count: 480]"`).

---

## 5. Granular Sharing & Collaboration Model

| Sharing Level | Mechanism via GitHub | Access Control |
| :--- | :--- | :--- |
| **Library Level** | Share the entire GitHub Repository with a collaborator. | Read-Only (Viewer) or Read/Write (Editor via repo invite). |
| **Shelf Level** | Export/sync shelf folder to a shared repository or sub-tree. | Collaborators can sync and contribute via pull requests/commits. |
| **Book Level** | Export/publish book to a **Secret GitHub Gist** or public link. | Anyone with the link can open the book in a standalone reader UI. |

- **Public Web Reader Mode**: Anyone visiting `thelibrary.app/?gist={gist_id}` or `/?repo={owner}/{repo}&book={book_id}` can read the journal in a tactile digital book layout without needing to log in.

---

## 6. Detailed Data Schemas (JSON Specifications)

### `library.json`
```json
{
  "version": "1.0",
  "id": "lib_a1b2c3d4",
  "name": "Personal Sanctuary",
  "description": "Daily thoughts, reading notes, and creative writing.",
  "woodMaterial": "walnut", // walnut | oak | mahogany | birch | midnight
  "createdAt": "2026-09-02T13:30:00Z",
  "updatedAt": "2026-09-02T13:30:00Z",
  "shelvesOrder": ["shelf_01", "shelf_02"]
}
```

### `shelf.json`
```json
{
  "id": "shelf_01",
  "libraryId": "lib_a1b2c3d4",
  "name": "Daily Reflections",
  "nameplateStyle": "brass", // brass | silver | matte-black | bronze
  "order": 0,
  "booksOrder": ["book_101", "book_102"],
  "createdAt": "2026-09-02T13:30:00Z",
  "updatedAt": "2026-09-02T13:30:00Z"
}
```

### `book.json`
```json
{
  "id": "book_101",
  "shelfId": "shelf_01",
  "title": "2026 Journal",
  "subtitle": "Volume I",
  "spineColor": "#8B263E",
  "spineStyle": "ribbed-leather", // ribbed-leather | gold-foil | woven-cloth | modern-matte | vintage-parchment
  "titleColor": "#FFD700", // gold | silver | white | copper | black
  "titleFont": "serif", // serif | roman | typewriter | calligraphy | sans
  "ribbonColor": "#D4AF37",
  "hasRibbon": true,
  "pageCount": 14,
  "calculatedWidth": 53,
  "createdAt": "2026-09-02T13:30:00Z",
  "updatedAt": "2026-09-02T13:30:00Z"
}
```

### `page_001.json`
```json
{
  "id": "page_001",
  "bookId": "book_101",
  "pageNumber": 1,
  "title": "A New Beginning",
  "entryDate": "2026-09-02T08:00:00Z",
  "paperStyle": "lined", // lined | dotted | parchment | slate
  "mood": "great", // great | good | neutral | low | stormy
  "tags": ["morning", "reflection", "goals"],
  "wordCount": 342,
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "Morning Reflections" }]
      },
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Setting up my new digital library today..." }]
      }
    ]
  },
  "createdAt": "2026-09-02T13:30:00Z",
  "updatedAt": "2026-09-02T13:30:00Z"
}
```

---

## 7. GitHub Actions CI/CD Pipeline (`.github/workflows/deploy.yml`)

The app automatically builds and publishes to GitHub Pages on every `git push`:

```yaml
name: Deploy The Journal Library to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build with Vite
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 8. Implementation Roadmap

### Phase 1: Project Scaffolding & Design System
- Setup **Vue 3 + Vite + TypeScript + Tailwind CSS** configured for production.
- Build the **Skeuomorphic 3D Bookshelf Component**:
  - Procedural wood shelves (Walnut, Oak, Mahogany, Midnight) with drop shadows and metallic nameplates.
  - Custom Book Spine component with dynamic thickness scaling formula ($W_{\min} = 28\text{px}$, $W_{\max} = 110\text{px}$).
  - Spine customizer: Hex color picker, finishes (leather, cloth, foil), typography, and ribbon bookmarks.
- Setup **Dexie.js / IndexedDB** local database for 0ms instant local reads/writes.

### Phase 2: Writing Desk & Page Editor
- Implement the **3D Book-Pull Animation** (smooth transition from shelf to writing desk).
- Integrate **Tiptap Rich-Text Editor** with paper styles (lined, dotted, parchment).
- Multi-page pagination, page flipping, word counter, and metadata (mood, tags, timestamps).
- Auto-recalculation of book spine thickness as pages are added or removed.

### Phase 3: GitHub as DB Sync Engine & Auth
- Implement GitHub Authentication (Personal Access Token & OAuth flow).
- Build the **Git Sync Engine**:
  - Read/Write repository and Gist data via Octokit / Fetch API.
  - Background debounced batch commits to prevent rate limits.
  - Conflict resolution & offline sync queue.

### Phase 4: Sharing & GitHub Pages Deployment
- Granular sharing interface (Public Gist export, repo collaborator access, read-only reader link).
- Add `.github/workflows/deploy.yml` for automated GitHub Pages hosting.
- Responsive mobile touch tuning & PWA manifest support.
