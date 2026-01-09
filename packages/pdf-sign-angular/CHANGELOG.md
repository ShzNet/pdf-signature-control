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

- allow control dependency in angular lib ([a21bacd](https://github.com/ShzNet/pdf-signature-control/commit/a21bacd))
- make control a direct dependency for all wrappers ([467e437](https://github.com/ShzNet/pdf-signature-control/commit/467e437))

### ❤️ Thank You

- Chien Tran

## 0.2.0 (2026-01-09)

### 🚀 Features

- **demo:** enhance responsive layout and functionality parity ([06f7cce](https://github.com/ShzNet/pdf-signature-control/commit/06f7cce))
- **ui:** redesign demo layout and optimize zoom functionality ([5e0b4c6](https://github.com/ShzNet/pdf-signature-control/commit/5e0b4c6))
- **pdf-sign-control:** add gesture zoom with optimized progressive rendering ([03073f4](https://github.com/ShzNet/pdf-signature-control/commit/03073f4))
- setup framework demos and remove Vue support ([358dca5](https://github.com/ShzNet/pdf-signature-control/commit/358dca5))
- setup project structure and initial libraries ([faec1b4](https://github.com/ShzNet/pdf-signature-control/commit/faec1b4))

### 🩹 Fixes

- relax dependencies and enable silent release ([7aaa7a0](https://github.com/ShzNet/pdf-signature-control/commit/7aaa7a0))
- correct release configuration for angular package ([1f0aa6e](https://github.com/ShzNet/pdf-signature-control/commit/1f0aa6e))
- **react:** resolve field visibility and sync issues ([5ea9adb](https://github.com/ShzNet/pdf-signature-control/commit/5ea9adb))

### ❤️ Thank You

- Chien Tran

## 0.0.2 (2026-01-09)

### 🩹 Fixes

- relax dependencies and enable silent release ([7aaa7a0](https://github.com/ShzNet/pdf-signature-control/commit/7aaa7a0))
- correct release configuration for angular package ([1f0aa6e](https://github.com/ShzNet/pdf-signature-control/commit/1f0aa6e))

### ❤️ Thank You

- Chien Tran