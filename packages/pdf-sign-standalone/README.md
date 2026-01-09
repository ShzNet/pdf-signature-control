# @shznet/pdf-sign-standalone

A bundled version of the PDF Sign Control for usage in Vanilla JS or environments without a bundler.

## Usage

Include the script directly or import it:

```html
<script src="path/to/pdf-sign-standalone.js"></script>
<link rel="stylesheet" href="path/to/pdf-sign-standalone.css">

<div id="pdf-root" style="width: 100%; height: 600px;"></div>

<script>
  // The global variable `PdfSignStandalone` is available
  const container = document.getElementById('pdf-root');
  const app = new PdfSignStandalone.PdfSignControl(container);
  
  app.init('https://example.com/sample.pdf');
</script>
```

## Versioning

This package follows the version of `@shznet/pdf-sign-control`.
