# @shznet/pdf-sign-standalone

This package provides a pre-configured entry point for the `@shznet/pdf-sign` ecosystem.

## Installation

```bash
npm install @shznet/pdf-sign-standalone
```

## Usage

```typescript
import { PdfSignControl } from '@shznet/pdf-sign-standalone';

const container = document.getElementById('pdf-root');
const control = new PdfSignControl({
  container: container,
  viewMode: 'scroll'
});

await control.load('https://example.com/doc.pdf');
```

## Versioning

This package follows the version of `@shznet/pdf-sign-control`.
