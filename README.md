# @shznet/pdf-sign

A comprehensive PDF signing and annotation SDK built with **Nx**. This repository contains the core logic and framework-specific wrappers to integrate PDF signature capabilities into any web application.

The runnable project has been moved into [`FE-control`](./FE-control). Root-level Markdown files are kept outside for documentation only.

## 📦 Packages

This monorepo hosts the following packages:

| Package | Version | Description |
|---------|---------|-------------|
| **[`@shznet/pdf-sign-control`](./FE-control/packages/pdf-sign-control)** | [![npm](https://img.shields.io/npm/v/@shznet/pdf-sign-control)](https://www.npmjs.com/package/@shznet/pdf-sign-control) | 🧠 **Core Library**: The framework-agnostic engine that handles PDF rendering (via PDF.js), signature field management, and user interactions. |
| **[`@shznet/pdf-sign-react`](./FE-control/packages/pdf-sign-react)** | [![npm](https://img.shields.io/npm/v/@shznet/pdf-sign-react)](https://www.npmjs.com/package/@shznet/pdf-sign-react) | ⚛️ **React Wrapper**: A React component wrapper around the core control. |
| **[`@shznet/pdf-sign-angular`](./FE-control/packages/pdf-sign-angular)** | [![npm](https://img.shields.io/npm/v/@shznet/pdf-sign-angular)](https://www.npmjs.com/package/@shznet/pdf-sign-angular) | 🛡️ **Angular Wrapper**: An Angular component library for seamless integration. |
| **[`@shznet/pdf-sign-standalone`](./FE-control/packages/pdf-sign-standalone)** | [![npm](https://img.shields.io/npm/v/@shznet/pdf-sign-standalone)](https://www.npmjs.com/package/@shznet/pdf-sign-standalone) | 🌐 **Standalone**: A pre-bundled version suitable for direct usage in `<script>` tags or Vanilla JS apps. |

## ✨ Key Features

-   **High Performance Rendering**: Built on top of [PDF.js](https://mozilla.github.io/pdf.js/) for accurate and fast PDF display.
-   **Draggable Signature Fields**: Add, move, resize, and delete signature placeholders.
-   **Multi-View Modes**: Support for **Single Page** navigation or **Scroll (Continuous)** view.
-   **Zoom & Scale**: Smooth zooming capabilities (Fit Width, Fit Page, Custom Scale).
-   **Framework Agnostic**: The core logic is isolated, ensuring consistent behavior across React, Angular, Vue, and Vanilla JS.
-   **TypeScript**: Fully typed for excellent developer experience.

## 🚀 Development & Demos

This repo comes with ready-to-use demo applications to test each package.

### Prerequisites
- Node.js >= 20
- NPM

### Start Demos

```bash
cd FE-control

# Install dependencies
npm install

# Start Vanilla JS Demo
npx nx serve demo-vanilla

# Start React Demo
npx nx serve demo-react

# Start Angular Demo
npx nx serve demo-angular
```

## 🛠 Building

To build all packages:

```bash
cd FE-control

npx nx run-many -t build
```

To build a specific package:

```bash
cd FE-control

npx nx build @shznet/pdf-sign-control
```

## 📦 Release & Publishing

We use **Nx Release** with Conventional Commits.

1.  **Commit**: Use `feat:`, `fix:`, `chore:` correctly.
2.  **Push**: Merging to `main` triggers the CI/CD pipeline.
3.  **Publish**: The pipeline automatically tags, versions, and publishes to NPM.

## 🤝 Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feat/amazing-feature`).
3.  Commit your changes (`git commit -m 'feat: add amazing feature'`).
4.  Push to the branch.
5.  Open a Pull Request.

---
Built with ❤️ using [Nx](https://nx.dev).
