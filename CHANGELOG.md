## 1.0.1 (2026-01-19)

### 🚀 Features

- **pdf-sign:** enhance selection handling and add clearFields API ([4213377](https://github.com/ShzNet/pdf-signature-control/commit/4213377))

### ❤️ Thank You

- Chien Tran

# 1.0.0 (2026-01-09)

### 🚀 Features

- ⚠️  transition to 1-based page numbering for public API and models ([30e3ba8](https://github.com/ShzNet/pdf-signature-control/commit/30e3ba8))

### ⚠️  Breaking Changes

- transition to 1-based page numbering for public API and models  ([30e3ba8](https://github.com/ShzNet/pdf-signature-control/commit/30e3ba8))
  Consumers must update `SignatureField` definitions to use `pageNumber` (1-based) instead of `pageIndex`.

### ❤️ Thank You

- Chien Tran

## 0.2.3 (2026-01-09)

### 🚀 Features

- ⚠️  **core): add getPageDimensions API feat(react): expose field management and dimension APIs feat(angular:** add two-way page binding and dimensions API ([f273e8b](https://github.com/ShzNet/pdf-signature-control/commit/f273e8b))

### ⚠️  Breaking Changes

- **core): add getPageDimensions API feat(react): expose field management and dimension APIs feat(angular:** add two-way page binding and dimensions API  ([f273e8b](https://github.com/ShzNet/pdf-signature-control/commit/f273e8b))
  `pageChange` now emits number only (use `pageInfo` for details)
  - Docs: Update READMEs with new API usage and examples

### ❤️ Thank You

- Chien Tran

## 0.2.2 (2026-01-09)

### 🚀 Features

- **core:** implement print functionality with signature support ([c8c8450](https://github.com/ShzNet/pdf-signature-control/commit/c8c8450))

### ❤️ Thank You

- Chien Tran

## 0.2.1 (2026-01-09)

### 🩹 Fixes

- make control a direct dependency for all wrappers ([467e437](https://github.com/ShzNet/pdf-signature-control/commit/467e437))
- allow control dependency in angular lib ([a21bacd](https://github.com/ShzNet/pdf-signature-control/commit/a21bacd))

### ❤️ Thank You

- Chien Tran

## 0.2.0 (2026-01-09)

### 🚀 Features

- setup project structure and initial libraries ([faec1b4](https://github.com/ShzNet/pdf-signature-control/commit/faec1b4))
- setup framework demos and remove Vue support ([358dca5](https://github.com/ShzNet/pdf-signature-control/commit/358dca5))
- setup framework demos and remove Vue support ([5400fc4](https://github.com/ShzNet/pdf-signature-control/commit/5400fc4))
- implement field events and sync vanilla demo ([3baabb5](https://github.com/ShzNet/pdf-signature-control/commit/3baabb5))
- **demo:** enhance responsive layout and functionality parity ([06f7cce](https://github.com/ShzNet/pdf-signature-control/commit/06f7cce))
- **pdf-sign-control:** add view mode strategies (single/scroll) and refactor folder structure ([be53564](https://github.com/ShzNet/pdf-signature-control/commit/be53564))
- **pdf-sign-control:** add gesture zoom with optimized progressive rendering ([03073f4](https://github.com/ShzNet/pdf-signature-control/commit/03073f4))
- **signature:** redesign modal UI and refactor generator for consistent rendering ([ff872dc](https://github.com/ShzNet/pdf-signature-control/commit/ff872dc))
- **ui:** redesign demo layout and optimize zoom functionality ([5e0b4c6](https://github.com/ShzNet/pdf-signature-control/commit/5e0b4c6))

### 🩹 Fixes

- update release workflow flags ([3bc5eed](https://github.com/ShzNet/pdf-signature-control/commit/3bc5eed))
- correct release configuration for angular package ([1f0aa6e](https://github.com/ShzNet/pdf-signature-control/commit/1f0aa6e))
- force trigger npm publish ([554cef7](https://github.com/ShzNet/pdf-signature-control/commit/554cef7))
- relax dependencies and enable silent release ([7aaa7a0](https://github.com/ShzNet/pdf-signature-control/commit/7aaa7a0))
- allow release fallback to disk version ([af2de84](https://github.com/ShzNet/pdf-signature-control/commit/af2de84))
- use first-release flag ([695bba2](https://github.com/ShzNet/pdf-signature-control/commit/695bba2))
- add build step to release workflow ([c2301af](https://github.com/ShzNet/pdf-signature-control/commit/c2301af))
- **react:** resolve field visibility and sync issues ([5ea9adb](https://github.com/ShzNet/pdf-signature-control/commit/5ea9adb))
- **react:** resolve field visibility and sync issues ([6c1821a](https://github.com/ShzNet/pdf-signature-control/commit/6c1821a))

### ❤️ Thank You

- Chien Tran

## 0.0.2 (2026-01-09)

### 🩹 Fixes

- update release workflow flags ([3bc5eed](https://github.com/ShzNet/pdf-signature-control/commit/3bc5eed))
- correct release configuration for angular package ([1f0aa6e](https://github.com/ShzNet/pdf-signature-control/commit/1f0aa6e))
- force trigger npm publish ([554cef7](https://github.com/ShzNet/pdf-signature-control/commit/554cef7))
- relax dependencies and enable silent release ([7aaa7a0](https://github.com/ShzNet/pdf-signature-control/commit/7aaa7a0))

### ❤️ Thank You

- Chien Tran