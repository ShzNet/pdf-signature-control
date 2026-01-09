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

    private boundHandleMouseMove: (e: MouseEvent) => void;
    private boundHandleTouchMove: (e: TouchEvent) => void;
    private boundHandleMouseUp: (e: MouseEvent) => void;
    private boundHandleTouchEnd: (e: TouchEvent) => void;
    private boundHandleMouseDown: (e: MouseEvent) => void;
    private boundHandleTouchStart: (e: TouchEvent) => void;

    constructor(container: HTMLElement, callbacks: InteractionCallbacks) {
        this.container = container;
        this.dragHandler = new DragHandler(callbacks.onDragEnd);
        this.resizeHandler = new ResizeHandler(callbacks.onResizeEnd);

        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandleTouchMove = this.handleTouchMove.bind(this);
        this.boundHandleMouseUp = this.handleMouseUp.bind(this);
        this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
        this.boundHandleMouseDown = this.handleMouseDown.bind(this);
        this.boundHandleTouchStart = this.handleTouchStart.bind(this);

        this.init();
    }

    private init() {
        // We attach listeners to the container
        this.container.addEventListener('mousedown', this.boundHandleMouseDown);
        this.container.addEventListener('touchstart', this.boundHandleTouchStart);

        window.addEventListener('mousemove', this.boundHandleMouseMove);
        window.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });

        window.addEventListener('mouseup', this.boundHandleMouseUp);
        window.addEventListener('touchend', this.boundHandleTouchEnd);
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
                this.dragHandler.startDrag(e, field, id);
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
            // Prevent scrolling while dragging
            if (e.cancelable) e.preventDefault();
            this.dragHandler.handleMove(e);
        } else if (this.resizeHandler.isActive()) {
            if (e.cancelable) e.preventDefault();
            this.resizeHandler.handleMove(e);
        }
    }

    private handleMouseUp(e: MouseEvent) {
        this.dragHandler.handleEnd(e);
        this.resizeHandler.handleEnd();
    }

    private handleTouchEnd(e: TouchEvent) {
        this.dragHandler.handleEnd(e);
        this.resizeHandler.handleEnd();
    }

    destroy() {
        this.container.removeEventListener('mousedown', this.boundHandleMouseDown);
        this.container.removeEventListener('touchstart', this.boundHandleTouchStart);

        window.removeEventListener('mousemove', this.boundHandleMouseMove);
        window.removeEventListener('touchmove', this.boundHandleTouchMove);
        window.removeEventListener('mouseup', this.boundHandleMouseUp);
        window.removeEventListener('touchend', this.boundHandleTouchEnd);
    }
}
