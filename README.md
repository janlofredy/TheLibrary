# The Journal Library 📚✨

> A modern, lightweight digital journaling web app built with a **modern skeuomorphic physical bookshelf aesthetic**, **first-principles 2D physics engine**, **Vue Vapor Mode**, and **GitHub as a Database**.

---

## 🌟 Features

- **🏛️ Multi-Level Architecture**: Organize your thoughts across **Libraries**, **Shelves**, **Books**, and **Pages**.
- **🪵 Skeuomorphic Bookshelf**: Procedural wood grain finishes (Walnut, Oak, Mahogany, Birch, Midnight), ambient occlusion shadows, and customizable metallic nameplates (Brass, Silver, Matte Black, Bronze).
- **📖 Dynamic Book Sizing & First-Principles Physics Engine**:
  - **Dynamic Thickness**: Spines physically widen with page count: $\text{Width} = \operatorname{clamp}(28\text{px},\; 32\text{px} + (\text{Page Count} \times 1.6\text{px}),\; 110\text{px})$.
  - **Procedural Height**: Natural height variation ($195\text{px} - 265\text{px}$) deterministically generated from a hash of the book's `UUID` seed.
  - **Dynamic Gap-Spanning Leaning**: Books calculate exact trigonometric reach angles ($\sin(\theta) = \frac{\text{totalGap}}{\min(H_1, H_2)}$) to physically touch and rest against neighboring books without floating air gaps.
  - **Height-Differential Tilt**: Taller books lean steeper downward to meet shorter books' top edges.
  - **Mutual A-Frame Arches**: Adjacent books leaning into each other form a stable arch meeting at their apex.
  - **Cascading Domino Support**: Leaning stacks dynamically span tilted neighbor surfaces.
  - **Outward Stack-Edge Leaning**: Books at the edge of packed stacks lean outward into open space.
  - **Wall-Supported Upright Stance**: Books hugging the left ($X \le 28\text{px}$) or right ($X \ge \text{shelfWidth} - 28\text{px}$) wooden shelf walls with an adjacent book stand firmly upright ($0^\circ$).
  - **Outward Fall-to-Flat**: Unsupported solitary books ($gap \ge H$) naturally topple and lie flat on the wooden floor ($[X, X + H]$ on left, $[X_{\text{baseRight}} - H, X_{\text{baseRight}}]$ on right).
  - **Inviolable Hard Upright Bounds**: Strict non-collision validation ensures books never overlap.
  - **1:1 Live Drag Ghost Previews**: Real-time drag preview perfectly mirrors the exact final settled placement upon drop.
- **📐 Shelf Spot Positioning & Layering**: Place books at precise coordinates with free drag-and-drop or arrange in stacked layers.
- **🎨 Deep Spine Customization**: Recustomizable spine colors, textures (Ribbed Leather, Gold Foil, Woven Cloth, Modern Matte, Vintage Parchment), title typography, foil colors, and ribbon bookmarks.
- **✍️ Tactile Writing Desk**: 3D book-pull animation onto a distraction-free writing desk with paper textures (lined, dotted, parchment) and a rich-text / markdown editor.
- **⚡ Ultra-Lightweight (Vue Vapor Mode)**: Zero Virtual DOM overhead, <15 KB runtime footprint, silky-smooth 60 FPS GPU-accelerated 3D transforms.
- **🐙 GitHub as Database & Multi-Provider Auth**: Zero external backend servers needed. Saves directly to your private GitHub repositories with automated version control, with support for linking **Google Login** for 1-click access across devices.
- **📱 First-Class PWA & Offline Engine**: Installable standalone app on iOS, Android, and Desktop with instant <100ms startup and Background Sync.
- **🔄 Multi-Device Sync & Conflict Engine**: Granular file isolation, AST 3-way auto-merging, and visual "Compare & Merge" UI with a strict **Zero Data Loss** guarantee.
- **🚀 100% Static & Deployable to GitHub Pages**: Local-first storage via IndexedDB with automated GitHub Actions CI/CD.
- **🔗 Granular Sharing**: Share at the Library, Shelf, or Book level.

---

## 📋 Full Specification

See [`SPECIFICATION.md`](./SPECIFICATION.md) for the complete product design, physics equations, architecture diagrams, data schemas, and implementation roadmap.

---

## 🛠️ Tech Stack

- **Framework**: Vue 3 (Vapor Mode) + Vite + TypeScript
- **Styling**: Tailwind CSS + Custom 3D CSS Shaders
- **Storage**: IndexedDB (Dexie.js) + GitHub REST API (Octokit)
- **Editor**: Tiptap (Rich Text & Markdown)
- **Deployment**: GitHub Pages via GitHub Actions CI/CD
