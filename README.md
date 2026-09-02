# The Journal Library 📚✨

> A modern, lightweight digital journaling web app built with a **modern skeuomorphic physical bookshelf aesthetic**, **Vue Vapor Mode**, and **GitHub as a Database**.

---

## 🌟 Features

- **🏛️ Multi-Level Architecture**: Organize your thoughts across **Libraries**, **Shelves**, **Books**, and **Pages**.
- **🪵 Skeuomorphic Bookshelf**: Procedural wood grain finishes (Walnut, Oak, Mahogany, Birch, Midnight), ambient occlusion shadows, and customizable metallic nameplates (Brass, Silver, Matte Black).
- **📖 Dynamic Book Sizing Engine**:
  - **Thickness**: Spines physically widen with page count: $\text{Width} = \operatorname{clamp}(28\text{px},\; 32\text{px} + (\text{Page Count} \times 1.5\text{px}),\; 110\text{px})$.
  - **Procedural Height**: Natural height variation ($190\text{px} - 265\text{px}$) deterministically generated from a hash of the book's `UUID` seed.
- **📐 Shelf Spot Positioning & Layering**: Place books at precise shelf slots with customizable orientation (standing upright, leaning against neighbors, or horizontally stacked in layers).
- **🎨 Deep Spine Customization**: Recustomizable spine colors, textures (Ribbed Leather, Gold Foil, Woven Cloth, Modern Matte, Vintage Parchment), title typography, foil colors, and ribbon bookmarks.
- **✍️ Tactile Writing Desk**: 3D book-pull animation onto a distraction-free writing desk with paper textures (lined, dotted, parchment) and a rich-text / markdown editor.
- **⚡ Ultra-Lightweight (Vue Vapor Mode)**: Zero Virtual DOM overhead, <15 KB runtime footprint, silky-smooth 60 FPS GPU-accelerated 3D transforms.
- **🐙 GitHub as Database & Multi-Provider Auth**: Zero external backend servers needed. Saves directly to your private GitHub repositories with automated version control, with support for linking **Google Login** for 1-click access across devices.
- **🚀 100% Static & Offline-First**: Instant local writing via IndexedDB (Dexie.js) and 1-click deployment to **GitHub Pages**.
- **🔗 Granular Sharing**: Share at the Library, Shelf, or Book level.

---

## 📋 Full Specification

See [`SPECIFICATION.md`](./SPECIFICATION.md) for the complete product design, architecture diagrams, data schemas, and implementation roadmap.

---

## 🛠️ Tech Stack

- **Framework**: Vue 3 (Vapor Mode) + Vite + TypeScript
- **Styling**: Tailwind CSS + Custom 3D CSS Shaders
- **Storage**: IndexedDB (Dexie.js) + GitHub REST API (Octokit)
- **Editor**: Tiptap (Rich Text & Markdown)
- **Deployment**: GitHub Pages via GitHub Actions CI/CD
