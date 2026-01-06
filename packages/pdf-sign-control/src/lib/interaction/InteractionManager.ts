import { DragHandler, DragEventData } from './DragHandler.js';
import { ResizeHandler, ResizeEventData } from './ResizeHandler.js';

export type { DragEventData, ResizeEventData };

export interface InteractionCallbacks {
    onDragEnd: (data: DragEventData) => void;
    onResizeEnd: (data: ResizeEventData) => void;
}

/**
 * Manages interactions (Drag, Resize) for the Signature Layer
 */
export class InteractionManager {
    private container: HTMLElement;
    private dragHandler: DragHandler;
    private resizeHandler: ResizeHandler;
    private scale = 1.0;

    constructor(container: HTMLElement, callbacks: InteractionCallbacks) {
        this.container = container;
        this.dragHandler = new DragHandler(callbacks.onDragEnd);
        this.resizeHandler = new ResizeHandler(callbacks.onResizeEnd);

        this.init();
    }

    private init() {
        // We attach listeners to the container
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this));

        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });

        window.addEventListener('mouseup', this.handleMouseUp.bind(this));
        window.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    setScale(scale: number) {
        this.scale = scale;
    }

    private handleMouseDown(e: MouseEvent) {
        this.handleStart(e, e.target as HTMLElement);
    }

    private handleTouchStart(e: TouchEvent) {
        this.handleStart(e, e.target as HTMLElement);
    }

    private handleStart(e: MouseEvent | TouchEvent, target: HTMLElement) {
        // Check for resize handle
        if (target.classList.contains('sc-resize-handle')) {
            const handle = target.dataset.handle;
            const field = target.closest('.sc-signature-field') as HTMLElement;
            if (handle && field) {
                const id = field.dataset.id;
                if (id) {
                    this.resizeHandler.startResize(e, field, id, handle, this.scale);
                }
            }
            return;
        }

        // Check for field drag
        const field = target.closest('.sc-signature-field') as HTMLElement;
        if (field) {
            // Check if deletable button clicked?
            if (target.closest('.sc-delete-btn')) {
                return; // Let click handler handle it
            }

            // Check if moveable
            if (field.dataset.moveable === 'false') {
                return;
            }

            const id = field.dataset.id;
            if (id) {
                this.dragHandler.startDrag(e, field, id, this.scale);
            }
        }
    }

    private handleMouseMove(e: MouseEvent) {
        if (this.dragHandler.isActive()) {
            this.dragHandler.handleMove(e);
        } else if (this.resizeHandler.isActive()) {
            this.resizeHandler.handleMove(e);
        }
    }

    private handleTouchMove(e: TouchEvent) {
        if (this.dragHandler.isActive()) {
            this.dragHandler.handleMove(e);
        } else if (this.resizeHandler.isActive()) {
            this.resizeHandler.handleMove(e);
        }
    }

    private handleMouseUp(e: MouseEvent) {
        this.dragHandler.handleEnd(e);
        this.resizeHandler.handleEnd(e);
    }

    private handleTouchEnd(e: TouchEvent) {
        this.dragHandler.handleEnd(e);
        this.resizeHandler.handleEnd(e);
    }

    destroy() {
        // TODO: Remove listeners
    }
}
