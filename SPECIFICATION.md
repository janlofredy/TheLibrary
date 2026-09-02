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

### 3.2 Dynamic Book Sizing & Procedural Height Engine

#### A. Dynamic Spine Thickness (Page Count Scaling)
The visual thickness (width) of a book spine on the shelf dynamically scales based on the number of written pages:

$$\text{Spine Width} = \operatorname{clamp}\left(W_{\min},\; W_{\text{base}} + (\text{Page Count} \times \Delta_{\text{page}}),\; W_{\max}\right)$$

- **Minimum Spine Width ($W_{\min}$)**: `28px` (ensures readability of vertical titles on fresh books).
- **Base Width ($W_{\text{base}}$)**: `32px`.
- **Page Growth Factor ($\Delta_{\text{page}}$)**: `1.6px` per written page (with logarithmic scaling after 25 pages).
- **Maximum Spine Width ($W_{\max}$)**: `110px` (maintains natural shelf proportions).
- **Page Edge Stratification**: When books exceed `48px` in thickness, realistic paper-leaf layering renders on the top edge.

#### B. Procedural Book Height (Deterministic UUID Seed)
To create a realistic, organic bookshelf where books have naturally varied heights (pocket editions, standard octavos, tall folios) without requiring manual configuration:
- Every book's height is **deterministically generated using a 32-bit FNV-1a hash of its unique `UUID`**:
  $$\text{Seed} = \operatorname{Hash32}(\text{book.id})$$
  $$\text{Height} = H_{\min} + \left(\frac{\text{Seed} \pmod{1000}}{1000} \times (H_{\max} - H_{\min})\right)$$
- **Height Bounds**: $H_{\min} = 195\text{px}$ (Compact/Pocket) to $H_{\max} = 265\text{px}$ (Tall Grand Volume).
- **Consistency Guarantee**: Because the seed is derived strictly from the `book.id` UUID, a book's physical height is 100% consistent across reloads, devices, and shared views with zero storage overhead.

---

### 3.3 First-Principles 2D Bookshelf Physics Engine

The bookshelf implements a deterministic first-principles physical mechanics engine governing leaning, contact forces, and gravity to deliver an authentic, tactile library experience:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     FIRST-PRINCIPLES PHYSICAL EQUATIONS                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. Dynamic Gap-Spanning Lean:                                               │
│    sin(θ) = totalGap / min(H_book, H_neighbor)                               │
│                                                                              │
│ 2. Height-Differential Tilt:                                                │
│    sin(θ_tall) = [gap · H_tall / (H_tall + H_short)] / H_short               │
│                                                                              │
│ 3. Mutual A-Frame Arch:                                                      │
│    Two adjacent books leaning inward meet at apex: sin(θ) = gap / (H_1 + H_2)│
│                                                                              │
│ 4. Domino Cascade Propagation:                                               │
│    totalGap = gap + H_neighbor · sin(|θ_neighbor|)                           │
│                                                                              │
│ 5. Wall-Supported Upright Stance:                                            │
│    Books flush against left wall (X ≤ 28px) or right wall (dist ≤ 28px)      │
│    with an adjacent book stand firmly UPRIGHT (θ = 0°).                      │
│                                                                              │
│ 6. Outward Fall-to-Flat Rule:                                                │
│    Unsupported books (gap ≥ H) fall flat on open floor:                      │
│    - Left-falling: [X_baseRight - H, X_baseRight]                            │
│    - Right-falling: [X, X + H]                                               │
│                                                                              │
│ 7. Inviolable Hard Upright Bounds:                                           │
│    Every book occupies upright footprint [X_i, X_i + W_i] with zero overlap. │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### A. Contact Normal & Leaning Rules
1. **Packed Volumes Stand Upright**: Books packed snugly side-by-side ($gap \le 16\text{px}$ on both sides) receive reciprocal normal forces and stand strictly upright ($\theta = 0^\circ$).
2. **Dynamic Gap-Spanning Reach**: Books tilt across open gaps until their top corner physically contacts the adjacent volume, eliminating floating air gaps.
3. **Height-Differential Tilt**: When a tall volume leans onto a shorter volume, the tall volume tilts steeper downward to rest against the top edge of the shorter book.
4. **Mutual A-Frame Arches**: When two adjacent volumes tilt toward each other, they form a stable triangular arch resting on their top apex contact points.
5. **Cascading Domino Propagation**: In a multi-book cascade, each successive volume spans the tilted top surface of its predecessor ($totalGap = gap + H_N \sin|\theta_N|$).
6. **Outward Stack-Edge Leaning**: A volume at the end of a packed stack leans **outward** into open space, supported from behind by the upright stack.
7. **Wall-Supported Upright Stance**: Volumes adjacent to the left wooden wall frame ($X \le 28\text{px}$) or right wooden wall frame ($X \ge \text{shelfWidth} - 28\text{px}$) stand **firmly upright ($\theta = 0^\circ$)**, supported between the rigid wall and the book stack.
8. **Outward Fall-to-Flat**: Solitary volumes without support in reach ($gap \ge H$) topple onto the floor (`isFlat: true`). When falling left, their flat footprint is positioned at $[X_{\text{baseRight}} - H, X_{\text{baseRight}}]$, lying completely to the left of standing stacks with zero clipping.
9. **Inviolable Hard Upright Bounds**: In `resolveNonOverlappingPosition`, each book's upright base interval $[X_i, X_i + W_i]$ is enforced as a hard boundary. Books strictly dock beside each other with zero overlap.
10. **1:1 Live Drag Ghost Preview**: The drag ghost dynamically calculates its rendered coordinate `ghostRenderedX`, wall tilts, domino reach, and flat fall geometry, guaranteeing a 1:1 match with the settled drop position.

---

### 3.4 The Reading Desk & Book-Opening Experience
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

### 4.2 Authentication, Landing Page & Onboarding Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEW VISITOR / UNAUTHENTICATED                   │
│                                      │                                 │
│                                      ▼                                 │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │                         LANDING PAGE                               │ │
│ │ - Skeuomorphic hero presentation & live feature demo               │ │
│ │ - "Your Sovereign Digital Sanctuary — Private & Tactile"           │ │
│ │ - Actions: [Sign in with GitHub]  |  [Sign in with Google]         │ │
│ └────────────────────────────────────┬───────────────────────────────┘ │
│                                      │ (Requires Login)                │
│                                      ▼                                 │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │                  AUTHENTICATION GATE & PROVISIONING                │ │
│ │ - Authenticates via GitHub OAuth / PAT (or linked Google)          │ │
│ │ - Automatically connects/provisions user's private data vault      │ │
│ │ - Initializes a PRISTINE EMPTY LIBRARY (0 books, 1 empty shelf)    │ │
│ └────────────────────────────────────┬───────────────────────────────┘ │
│                                      │                                 │
│                                      ▼                                 │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │                    ACTIVE BOOKSHELF / LIBRARY VIEW                 │ │
│ │ - Pristine wooden shelf with "Create Your First Journal" prompt    │ │
│ │ - Tactile drag-and-drop, physics leaning, and writing desk         │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

#### **1. Landing Page Architecture (Unauthenticated State)**
- When an unauthenticated visitor opens the web app, they are greeted by an atmospheric **Skeuomorphic Landing Page**:
  - **Visual Hero**: High-resolution dark walnut wooden shelf backdrop with ambient candlelight warmth and tactile 3D spine material previews.
  - **Core Value Proposition**: Sovereign, private digital journaling with physical books, 2D physics leaning, and GitHub-backed version control.
  - **Interactive Demos**: Live interactive spine customization preview and 2D physics demo.
  - **Call to Action**: Prominent **"Sign in with GitHub"** and **"Sign in with Google"** buttons.

#### **2. Mandatory Authentication Gate**
- Creating a library and accessing the bookshelf workspace **strictly requires user authentication**.
- Unauthenticated access is restricted to:
  - The **Landing Page**.
  - **Public Reader Mode**: Direct URL links to shared books/gists (`/?gist=...` or `/?repo=...&book=...`).

#### **3. Pristine Empty Library Provisioning**
- When a new user completes authentication for the first time:
  - The app provisions their personal library (`Personal Sanctuary`) with a single clean shelf (`Main Shelf`).
  - **Strictly Empty Initialization**: The library contains **ZERO pre-populated books** ($0$ volumes), giving the user a clean slate.
  - An inviting, skeuomorphic **"Add Your First Journal"** prompt appears centered on the empty shelf ledge, guiding the user to design their first journal.

#### **4. Multi-Provider Identity Model**
- **Primary Onboarding (GitHub)**:
  - Users sign up and establish their journal storage vault via GitHub (GitHub OAuth or Personal Access Token).
  - Automatically provisions the user's private data repository (e.g., `the-journal-vault`).
- **Linked Google Sign-In (Google OAuth 2.0 / OpenID Connect)**:
  - Once the account is established via GitHub, users can link their **Google Account** in Settings with one click.
  - **Subsequent Logins**: The user can log in using either **"Sign in with GitHub"** or **"Sign in with Google"** on any device or browser.
  - **Identity Binding & Token Management**:
    - The linked Google user ID (`sub`) and verified email are securely associated with the account's repository vault.
    - Enables effortless 1-tap Google Sign-In on mobile devices without needing to re-authenticate with GitHub credentials every time.
  - **Local Session Persistence**: Active sessions are cached securely in IndexedDB with auto-refreshing OAuth tokens for seamless offline-to-online transitions.

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

### 4.3 Progressive Web App (PWA) & Offline Engine
The application is built with a first-class **PWA (Progressive Web App)** architecture via `vite-plugin-pwa` and Workbox:

1. **Native App Installation**:
   - Installable as a standalone app on iOS (Safari Add to Home Screen), Android (Chrome Install), macOS, Windows, and Linux.
   - Customized Web App Manifest (`display: standalone`, theme color `#1A130E` / `#F8F5E9`, high-res tactile book icons).
2. **Offline-First Caching Strategy**:
   - **App Shell & Assets (Cache-First)**: Core JS, CSS, wood textures, paper grain, and fonts are cached on first load for instant **<100ms offline startup**.
   - **Data Layer (IndexedDB)**: 100% of reading and writing happens directly against the local IndexedDB database, ensuring zero input latency and complete functionality in airplane mode or off-grid.
3. **Background Sync API**:
   - Uses the browser's `SyncManager` (and fallback window focus/online listeners) to automatically flush queued edits to GitHub the moment network connectivity is re-established.

---

### 4.4 Multi-Device Sync & Conflict Resolution Engine

When a user edits their journal across multiple devices (e.g. iPhone on the train offline, MacBook at home), the synchronization engine handles concurrent changes through a multi-tier safety architecture with a **strict Zero Data Loss guarantee**:

```
                                 [Device A (iPhone)]          [Device B (MacBook)]
                                 Offline edits Page 1         Offline edits Page 1
                                           │                            │
                                           ▼ (Network restored)         ▼ (Network restored)
                                  ┌──────────────────────────────────────────────┐
                                  │           SYNC & CONFLICT DETECTOR           │
                                  │ - Compares baseCommitSha & deviceVectors     │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                        ┌────────────────────────────────┴────────────────────────────────┐
                        ▼                                                                 ▼
             [Case 1: Different Pages/Books]                                   [Case 2: Exact Same Page]
             - Clean 3-way Git merge                                           - Structural AST 3-way auto-merge
             - 0 conflicts, instant sync                                       - If text overlaps: Auto-preserve
                                                                                 competing version as Snapshot
                                                                                 + Visual "Compare & Merge" UI
```

#### Layer 1: Granular File Isolation (Collision Prevention)
- Because every Page is stored in its own individual file (`page_001.json`, `page_002.json`) and Books/Shelves have isolated metadata:
  - If Device A writes on *Page 1* and Device B writes on *Page 2*: **Zero conflict**. Both files commit cleanly.
  - If Device A adds a *new Book* and Device B edits an *existing Book*: **Zero conflict**.

#### Layer 2: Same-Page Concurrent Edit Detection
Every page payload tracks:
- `baseCommitSha`: The exact Git commit SHA from which the local edit branched.
- `deviceOrigin`: Unique device signature (e.g. `iphone-safari-8f`, `mac-chrome-2b`).
- `clientTimestamp`: Monotonic timestamp of the edit.

When Device B attempts to push a page whose remote `baseCommitSha` has already been updated by Device A, a **conflict event** is triggered.

#### Layer 3: Conflict Resolution Strategies
1. **Structural AST 3-Way Auto-Merge**:
   - Tiptap / ProseMirror document nodes are analyzed. If Device A edited the *Title* and Device B added a *Paragraph at the bottom*, both changes are automatically merged without prompting the user.
2. **Automatic Conflict Snapshot (Zero Data Loss)**:
   - If both devices modified the *exact same sentence/paragraph*, the app never silently overwrites either version.
   - The newer edit is applied to the active page, while the alternate version is preserved in a designated **Conflict Snapshot** (`page_001_conflict_macbook.json`) attached to that page's history.
3. **Visual "Compare & Merge" UI**:
   - A subtle antique ribbon notification appears on the open book: *"Concurrent changes detected from another device (iPhone at 2:15 PM). [Compare & Merge]"*.
   - Clicking opens a side-by-side split desk view showing both versions, with 1-click buttons:
     - `Keep This Device`
     - `Keep Other Device`
     - `Combine Both (Append)`
4. **Git Version History Safety Net**:
   - Because all changes are committed to the user's GitHub repository, the entire history of every edit is permanently preserved in Git commit trees. Any previous state can be inspected or rolled back with 1 click.

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
  "id": "book_101_7f8a9c2b",
  "shelfId": "shelf_01",
  "title": "2026 Journal",
  "subtitle": "Volume I",
  "spineColor": "#8B263E",
  "spineStyle": "ribbed-leather", // ribbed-leather | gold-foil | woven-cloth | modern-matte | vintage-parchment
  "titleColor": "#FFD700", // gold | silver | white | copper | black
  "titleFont": "serif", // serif | roman | typewriter | calligraphy | sans
  "ribbonColor": "#D4AF37",
  "hasRibbon": true,
  "slotIndex": 3, // Coordinate spot/slot index along the shelf
  "layerMode": "standing", // standing | leaning-left | leaning-right | horizontal-stack
  "stackOrder": 0, // 0 if standing, or vertical stack index (0=bottom, 1=middle, 2=top)
  "pageCount": 14,
  "calculatedWidth": 53, // Dynamically computed: clamp(28, 32 + (14 * 1.5), 110)
  "calculatedHeight": 234, // Deterministically seeded from UUID hash: clamp(190, 265)
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
- Build the **First-Principles 2D Bookshelf Physics Engine**:
  - Dynamic gap-spanning lean angles, height-differential tilt, mutual A-frame arches, cascading domino support, and outward stack/wall fall-to-flat mechanics.
  - 1:1 live drag ghost preview overlay.
- Setup **Dexie.js / IndexedDB** local database for 0ms instant local reads/writes.

### Phase 2: Writing Desk & Page Editor
- Implement the **3D Book-Pull Animation** (smooth transition from shelf to writing desk).
- Integrate **Tiptap Rich-Text Editor** with paper styles (lined, dotted, parchment).
- Multi-page pagination, page flipping, word counter, and metadata (mood, tags, timestamps).
- Auto-recalculation of book spine thickness as pages are added or removed.

### Phase 3: GitHub as DB Sync Engine & Multi-Provider Auth
- Implement GitHub Primary Authentication (OAuth & Personal Access Token).
- Add **Google OAuth 2.0 Account Linking** (enabling 1-click Sign in with Google on subsequent sessions).
- Build the **Git Sync Engine**:
  - Read/Write repository and Gist data via Octokit / Fetch API.
  - Background debounced batch commits to prevent rate limits.
  - Conflict resolution & offline sync queue.

### Phase 4: Sharing & GitHub Pages Deployment
- Granular sharing interface (Public Gist export, repo collaborator access, read-only reader link).
- Add `.github/workflows/deploy.yml` for automated GitHub Pages hosting.
- Responsive mobile touch tuning & PWA manifest support.

### Phase 5: Landing Page, Authentication Gate & Empty Library Provisioning
- **Landing Page (`LandingView.vue`)**:
  - Atmospheric skeuomorphic hero section with rich wood textures, ambient lighting, and interactive 3D spine material previews.
  - Clear value proposition showcasing physical tactile books, 2D physics leaning, and GitHub-backed sovereignty.
  - **"Sign in with GitHub"** and **"Sign in with Google"** authentication triggers.
- **Authentication Gate**:
  - Restrict library workspace and creation strictly to authenticated users; route unauthenticated visitors to Landing Page.
  - Preserve public read-only access for shared Gists and reader links.
- **Pristine Empty Library Provisioning**:
  - When a new user authenticates for the first time, initialize an **Empty Library** with 1 clean shelf and **zero pre-populated books** ($0$ books).
  - Design an elegant, tactile **"Add Your First Journal"** prompt centered on the empty shelf ledge.
