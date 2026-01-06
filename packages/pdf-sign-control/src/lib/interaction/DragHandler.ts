import { SignatureField } from '../types.js';
import { CoordinateUtils } from '../utils/CoordinateUtils.js';

export interface DragEventData {
    fieldId: string;
    x: number;
    y: number;
}

export class DragHandler {
    private isDragging = false;
    private draggedElement: HTMLElement | null = null;
    private fieldId: string | null = null;

    // Drag state
    private startX = 0;
    private startY = 0;
    private startLeft = 0;
    private startTop = 0;
    private scale = 1.0;

    private onDragEndCallback?: (data: DragEventData) => void;

    constructor(onDragEnd: (data: DragEventData) => void) {
        this.onDragEndCallback = onDragEnd;
    }

    startDrag(e: MouseEvent | TouchEvent, element: HTMLElement, fieldId: string, scale: number) {
        this.isDragging = true;
        this.draggedElement = element;
        this.fieldId = fieldId;
        this.scale = scale;

        const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
        const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

        this.startX = clientX;
        this.startY = clientY;

        const rect = element.getBoundingClientRect();
        const parentRect = element.parentElement?.getBoundingClientRect();

        // Calculate relative position within parent
        if (parentRect) {
            this.startLeft = rect.left - parentRect.left;
            this.startTop = rect.top - parentRect.top;
        }

        element.classList.add('sc-dragging');
        document.body.style.cursor = 'move';

        e.preventDefault();
        e.stopPropagation();
    }

    handleMove(e: MouseEvent | TouchEvent) {
        if (!this.isDragging || !this.draggedElement) return;

        const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
        const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

        const dx = clientX - this.startX;
        const dy = clientY - this.startY;

        // Update position immediately for visual feedback
        const newLeft = this.startLeft + dx;
        const newTop = this.startTop + dy;

        this.draggedElement.style.left = `${newLeft}px`;
        this.draggedElement.style.top = `${newTop}px`;

        e.preventDefault();
    }

    handleEnd(e: MouseEvent | TouchEvent) {
        if (!this.isDragging || !this.draggedElement || !this.fieldId) return;

        const finalLeft = parseFloat(this.draggedElement.style.left || '0');
        const finalTop = parseFloat(this.draggedElement.style.top || '0');

        // Convert back to PDF Point coordinates
        // x_key = x_screen / scale
        const pdfX = finalLeft / this.scale;
        const pdfY = finalTop / this.scale;

        if (this.onDragEndCallback) {
            this.onDragEndCallback({
                fieldId: this.fieldId,
                x: pdfX,
                y: pdfY
            });
        }

        this.draggedElement.classList.remove('sc-dragging');
        document.body.style.cursor = '';

        this.isDragging = false;
        this.draggedElement = null;
        this.fieldId = null;
    }

    isActive(): boolean {
        return this.isDragging;
    }
}
