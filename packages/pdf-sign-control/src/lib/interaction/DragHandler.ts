


export interface DragEventData {
    fieldId: string;
    clientX: number;
    clientY: number;
    elementX: number;
    elementY: number;
}

export class DragHandler {
    private isDragging = false;
    private originalElement: HTMLElement | null = null;
    private ghostElement: HTMLElement | null = null;
    private fieldId: string | null = null;

    // Drag state
    private startX = 0;
    private startY = 0;
    private initialGhostLeft = 0;
    private initialGhostTop = 0;

    private onDragEndCallback?: (data: DragEventData) => void;

    constructor(onDragEnd: (data: DragEventData) => void) {
        this.onDragEndCallback = onDragEnd;
    }

    startDrag(e: MouseEvent | TouchEvent, element: HTMLElement, fieldId: string, _scale: number) {
        this.isDragging = true;
        this.originalElement = element;
        this.fieldId = fieldId;

        const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
        const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

        this.startX = clientX;
        this.startY = clientY;

        // Create Ghost Element
        const rect = element.getBoundingClientRect();
        this.ghostElement = element.cloneNode(true) as HTMLElement;
        this.ghostElement.style.position = 'fixed';
        this.ghostElement.style.left = `${rect.left}px`;
        this.ghostElement.style.top = `${rect.top}px`;
        this.ghostElement.style.width = `${rect.width}px`;
        this.ghostElement.style.height = `${rect.height}px`;
        this.ghostElement.style.zIndex = '9999';
        this.ghostElement.style.opacity = '0.8';
        this.ghostElement.style.pointerEvents = 'none'; // Pass events through to underlay
        this.ghostElement.classList.add('sc-dragging-ghost');

        // Improve Ghost Visuals
        this.ghostElement.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
        this.ghostElement.style.transform = 'scale(1.02)';

        document.body.appendChild(this.ghostElement);

        this.initialGhostLeft = rect.left;
        this.initialGhostTop = rect.top;

        // Hide original
        element.style.opacity = '0';
        document.body.style.cursor = 'move';

        e.preventDefault();
        e.stopPropagation();
    }

    handleMove(e: MouseEvent | TouchEvent) {
        if (!this.isDragging || !this.ghostElement) return;

        const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
        const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

        const dx = clientX - this.startX;
        const dy = clientY - this.startY;

        const newLeft = this.initialGhostLeft + dx;
        const newTop = this.initialGhostTop + dy;

        this.ghostElement.style.left = `${newLeft}px`;
        this.ghostElement.style.top = `${newTop}px`;

        e.preventDefault();
    }

    handleEnd(e: MouseEvent | TouchEvent) {
        if (!this.isDragging || !this.ghostElement || !this.fieldId || !this.originalElement) return;

        const clientX = e instanceof MouseEvent ? e.clientX : (e as any).changedTouches?.[0]?.clientX ?? 0;
        const clientY = e instanceof MouseEvent ? e.clientY : (e as any).changedTouches?.[0]?.clientY ?? 0;

        // Capture Ghost Position before removal
        const ghostRect = this.ghostElement.getBoundingClientRect();
        const elementX = ghostRect.left;
        const elementY = ghostRect.top;

        // Cleanup Ghost
        this.ghostElement.remove();
        this.ghostElement = null;

        // Restore Original
        this.originalElement.style.opacity = '1';
        document.body.style.cursor = '';

        if (this.onDragEndCallback) {
            this.onDragEndCallback({
                fieldId: this.fieldId,
                clientX,
                clientY,
                elementX,
                elementY
            });
        }

        this.isDragging = false;
        this.originalElement = null;
        this.fieldId = null;
    }

    isActive(): boolean {
        return this.isDragging;
    }
}
