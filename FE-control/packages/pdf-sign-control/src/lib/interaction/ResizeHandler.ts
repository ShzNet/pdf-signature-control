

export interface ResizeEventData {
    fieldId: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export class ResizeHandler {
    private isResizing = false;
    private resizedElement: HTMLElement | null = null;
    private fieldId: string | null = null;
    private handle: string | null = null; // nw, ne, sw, se

    private startX = 0;
    private startY = 0;
    private startRect: { left: number, top: number, width: number, height: number } = { left: 0, top: 0, width: 0, height: 0 };
    private maxWidth = 0;
    private maxHeight = 0;
    private scale = 1.0;

    private onResizeEndCallback?: (data: ResizeEventData) => void;

    constructor(onResizeEnd: (data: ResizeEventData) => void) {
        this.onResizeEndCallback = onResizeEnd;
    }

    startResize(e: MouseEvent | TouchEvent, element: HTMLElement, fieldId: string, handle: string, scale: number) {
        this.isResizing = true;
        this.resizedElement = element;
        this.fieldId = fieldId;
        this.handle = handle;
        this.scale = scale;

        const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
        const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

        this.startX = clientX;
        this.startY = clientY;

        const rect = element.getBoundingClientRect();
        const parentRect = element.parentElement?.getBoundingClientRect();

        if (parentRect) {
            this.maxWidth = parentRect.width;
            this.maxHeight = parentRect.height;
            this.startRect = {
                left: rect.left - parentRect.left,
                top: rect.top - parentRect.top,
                width: rect.width,
                height: rect.height
            };
        }

        element.classList.add('sc-resizing');
        document.body.style.cursor = this.getCursor(handle);

        e.preventDefault();
        e.stopPropagation();
    }

    handleMove(e: MouseEvent | TouchEvent) {
        if (!this.isResizing || !this.resizedElement || !this.handle) return;

        const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
        const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

        const dx = clientX - this.startX;
        const dy = clientY - this.startY;

        let newLeft = this.startRect.left;
        let newTop = this.startRect.top;
        let newWidth = this.startRect.width;
        let newHeight = this.startRect.height;

        // Min size constraint
        const minSize = 20;

        if (this.handle.includes('e')) {
            const maxAllowedWidth = this.maxWidth - this.startRect.left;
            newWidth = Math.min(Math.max(minSize, this.startRect.width + dx), maxAllowedWidth);
        }
        if (this.handle.includes('w')) {
            const effectiveDx = Math.max(-this.startRect.left, Math.min(dx, this.startRect.width - minSize));
            newLeft = this.startRect.left + effectiveDx;
            newWidth = this.startRect.width - effectiveDx;
        }
        if (this.handle.includes('s')) {
            const maxAllowedHeight = this.maxHeight - this.startRect.top;
            newHeight = Math.min(Math.max(minSize, this.startRect.height + dy), maxAllowedHeight);
        }
        if (this.handle.includes('n')) {
            const effectiveDy = Math.max(-this.startRect.top, Math.min(dy, this.startRect.height - minSize));
            newTop = this.startRect.top + effectiveDy;
            newHeight = this.startRect.height - effectiveDy;
        }

        this.resizedElement.style.left = `${newLeft}px`;
        this.resizedElement.style.top = `${newTop}px`;
        this.resizedElement.style.width = `${newWidth}px`;
        this.resizedElement.style.height = `${newHeight}px`;

        e.preventDefault();
    }

    handleEnd() {
        if (!this.isResizing || !this.resizedElement || !this.fieldId) return;

        const finalLeft = parseFloat(this.resizedElement.style.left);
        const finalTop = parseFloat(this.resizedElement.style.top);
        const finalWidth = parseFloat(this.resizedElement.style.width);
        const finalHeight = parseFloat(this.resizedElement.style.height);

        const pdfX = finalLeft / this.scale;
        const pdfY = finalTop / this.scale;
        const pdfW = finalWidth / this.scale;
        const pdfH = finalHeight / this.scale;

        if (this.onResizeEndCallback) {
            this.onResizeEndCallback({
                fieldId: this.fieldId,
                x: pdfX,
                y: pdfY,
                width: pdfW,
                height: pdfH
            });
        }

        this.resizedElement.classList.remove('sc-resizing');
        document.body.style.cursor = '';

        this.isResizing = false;
        this.resizedElement = null;
        this.fieldId = null;
        this.handle = null;
    }

    isActive(): boolean {
        return this.isResizing;
    }

    private getCursor(handle: string): string {
        switch (handle) {
            case 'nw': case 'se': return 'nwse-resize';
            case 'ne': case 'sw': return 'nesw-resize';
            default: return 'default';
        }
    }
}
