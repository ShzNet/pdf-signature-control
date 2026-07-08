export interface SignatureConfig {
    layout: 'horizontal' | 'vertical';
    fontSize: number; // 3-9, slider value
    sectionRatio?: number; // Percentage for visual section (default 35)

    // Visual content (Section 1)
    visualType: 'image' | 'drawing' | 'text';
    visualContent?: string; // Base64 image, drawing dataUrl, or text

    // Info lines (Section 2)
    infoLines: string[];
}

export class SignatureGenerator {
    /**
     * Generate signature widget HTML
     * Uses a trick to make font-size scale with container:
     * Set html { font-size: 1vh } then use em units
     * 1vh = 1% of iframe height, so em will be relative to container
     */
    generate(config: SignatureConfig): string {
        const {
            layout,
            fontSize,
            sectionRatio = 40,
            visualType,
            visualContent,
            infoLines
        } = config;

        // fontSize (6-12) → em units directly
        // fontSize 6 → 6em, fontSize 12 → 12em
        const fontSizeEm = fontSize;
        const titleFontSizeEm = fontSizeEm * 1.3;

        // Build Section 1 content
        let section1Html = '';
        if (visualContent) {
            if (visualType === 'text') {
                section1Html = `<div class="text-content">${visualContent}</div>`;
            } else {
                section1Html = `<img src="${visualContent}" class="visual-content">`;
            }
        }

        // Build Section 2 content (info lines)
        const section2Lines = infoLines
            .filter(line => line.trim() !== '')
            .map(line => `<div class="info-line">${line}</div>`)
            .join('');

        // Layout direction
        const isHorizontal = layout === 'horizontal';

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    /* KEY: Set root font-size to 1vh, then use em for relative sizing */
    html {
      font-size: 1vh;
    }
    body {
      width: 100%;
      height: 100vh;
      background: transparent;
      font-family: Arial, sans-serif;
      color: #333;
      overflow: hidden;
    }
    .sig-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: ${isHorizontal ? 'row' : 'column'};
      flex-direction: ${isHorizontal ? 'row' : 'column'};
      background: transparent;
    }
    .section-1 {
      ${isHorizontal ? `width: ${sectionRatio}%;` : `height: ${sectionRatio}%;`}
      ${isHorizontal ? 'height: 100%;' : 'width: 100%;'}
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .section-2 {
      ${isHorizontal ? `width: ${100 - sectionRatio}%;` : `height: ${100 - sectionRatio}%;`}
      ${isHorizontal ? 'height: 100%;' : 'width: 100%;'}
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0.5em 1em;
      overflow: hidden;
    }
    .text-content {
      font-size: ${titleFontSizeEm}em;
      font-weight: bold;
      text-align: center;
      word-break: break-word;
      padding: 0.5em;
      line-height: 1.2;
    }
    .visual-content {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .info-line {
      font-size: ${fontSizeEm}em;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  </style>
</head>
<body>
  <div class="sig-container">
    <div class="section-1">
      ${section1Html}
    </div>
    <div class="section-2">
      ${section2Lines}
    </div>
  </div>
</body>
</html>`;
    }
}
