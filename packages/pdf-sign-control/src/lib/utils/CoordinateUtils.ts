import { PageViewport } from 'pdfjs-dist';

export interface Point {
    x: number;
    y: number;
}

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class CoordinateUtils {
    /**
     * Convert PDF Point to Viewport Pixel Rect
     * Viewport must be generated with the correct scale.
     */
    static toViewportRect(pdfRect: Rect, viewport: PageViewport): Rect {
        // PDF.js uses a transform matrix [scaleX, skewY, skewX, scaleY, tx, ty]
        // Usually we can use viewport.convertToViewportRectangle
        // But the input for that is [x1, y1, x2, y2] (bottom-left, top-right usually)

        // Let's rely on standard scaling if rotation is 0
        // Or better: use the viewport's built-in conversion which handles rotation/transform

        // Input: pdfRect {x, y, w, h} (Top-Left origin in our system, usually PDF is Bottom-Left)
        // Wait, standard PDF coords are Bottom-Left origin.
        // BUT PDF.js usually abstracts/normalizes this?
        // Let's assume our `SignatureField.rect` is stored in "PDF User Space" (72 DPI).
        // Usually (0,0) is bottom-left of the page.

        // HOWEVER, standard web UI thinks (0,0) is TOP-LEFT.
        // It's inconsistent to mix them.

        // APPROACH: We will treat `SignatureField.rect` as "Unscaled Viewport Coordinates" (at 100% / 72dpi).
        // i.e., Origin is TOP-LEFT.
        // This makes life easier for Drag/Drop implementation.
        // If we strictly used PDF Bottom-Left coords, we'd have to flip Y every time.

        // So:
        // x_viewport = x_pdf * scale
        // y_viewport = y_pdf * scale
        // w_viewport = w_pdf * scale
        // h_viewport = h_pdf * scale

        return {
            x: pdfRect.x * viewport.scale,
            y: pdfRect.y * viewport.scale,
            width: pdfRect.width * viewport.scale,
            height: pdfRect.height * viewport.scale
        };
    }

    /**
     * Convert Viewport Pixel Rect to PDF Point Rect (unscaled)
     */
    static toPdfRect(viewportRect: Rect, scale: number): Rect {
        if (scale === 0) return viewportRect;
        return {
            x: viewportRect.x / scale,
            y: viewportRect.y / scale,
            width: viewportRect.width / scale,
            height: viewportRect.height / scale
        };
    }
}
