export interface ZoomHandlerOptions {
    container: HTMLElement;
    getScale: () => number;
    setScale: (scale: number) => void;
    minScale?: number;  // default: 0.5
    maxScale?: number;  // default: 5.0
    zoomStep?: number;
}

/**
 * Handles zoom gestures: mouse wheel (Ctrl+scroll), trackpad pinch, mobile pinch
 */
export class ZoomHandler {
    private container: HTMLElement;
    private getScale: () => number;
    private setScale: (scale: number) => void;

    private minScale: number;
    private maxScale: number;
    private zoomStep: number;

    // Touch state for pinch zoom
    private initialPinchDistance: number = 0;
    private initialScale: number = 1;

    // Bound handlers for cleanup
    private boundWheelHandler: (e: WheelEvent) => void;
    private boundTouchStartHandler: (e: TouchEvent) => void;
    private boundTouchMoveHandler: (e: TouchEvent) => void;
    private boundTouchEndHandler: (e: TouchEvent) => void;

    constructor(options: ZoomHandlerOptions) {
        this.container = options.container;
        this.getScale = options.getScale;
        this.setScale = options.setScale;

        this.minScale = options.minScale ?? 0.5;
        this.maxScale = options.maxScale ?? 5.0;
        this.zoomStep = options.zoomStep ?? 0.1;

        // Bind handlers
        this.boundWheelHandler = this.handleWheel.bind(this);
        this.boundTouchStartHandler = this.handleTouchStart.bind(this);
        this.boundTouchMoveHandler = this.handleTouchMove.bind(this);
        this.boundTouchEndHandler = this.handleTouchEnd.bind(this);
    }

    init(): void {
        // Mouse wheel / Trackpad pinch
        this.container.addEventListener('wheel', this.boundWheelHandler, { passive: false });

        // Mobile touch pinch
        this.container.addEventListener('touchstart', this.boundTouchStartHandler, { passive: false });
        this.container.addEventListener('touchmove', this.boundTouchMoveHandler, { passive: false });
        this.container.addEventListener('touchend', this.boundTouchEndHandler);
    }

    destroy(): void {
        this.container.removeEventListener('wheel', this.boundWheelHandler);
        this.container.removeEventListener('touchstart', this.boundTouchStartHandler);
        this.container.removeEventListener('touchmove', this.boundTouchMoveHandler);
        this.container.removeEventListener('touchend', this.boundTouchEndHandler);
    }

    /**
     * Handle mouse wheel zoom (Ctrl + wheel) and trackpad pinch
     * Browser converts trackpad pinch to wheel event with ctrlKey=true
     */
    private handleWheel(e: WheelEvent): void {
        // Only handle zoom when Ctrl is pressed (or trackpad pinch)
        if (!e.ctrlKey) {
            return;
        }

        // Prevent default browser zoom
        e.preventDefault();

        const currentScale = this.getScale();
        const delta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
        const newScale = this.clampScale(currentScale + delta);

        if (newScale !== currentScale) {
            this.setScale(newScale);
        }
    }

    /**
     * Handle touch start - detect pinch gesture (2 fingers)
     */
    private handleTouchStart(e: TouchEvent): void {
        if (e.touches.length === 2) {
            e.preventDefault();
            this.initialPinchDistance = this.getTouchDistance(e.touches);
            this.initialScale = this.getScale();
        }
    }

    /**
     * Handle touch move - calculate pinch zoom
     */
    private handleTouchMove(e: TouchEvent): void {
        if (e.touches.length !== 2 || this.initialPinchDistance === 0) {
            return;
        }

        e.preventDefault();

        const currentDistance = this.getTouchDistance(e.touches);
        const scaleFactor = currentDistance / this.initialPinchDistance;
        const newScale = this.clampScale(this.initialScale * scaleFactor);

        this.setScale(newScale);
    }

    /**
     * Handle touch end - reset pinch state
     */
    private handleTouchEnd(e: TouchEvent): void {
        if (e.touches.length < 2) {
            this.initialPinchDistance = 0;
            this.initialScale = this.getScale();
        }
    }

    /**
     * Calculate distance between two touch points
     */
    private getTouchDistance(touches: TouchList): number {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Clamp scale to min/max bounds
     */
    private clampScale(scale: number): number {
        return Math.min(Math.max(scale, this.minScale), this.maxScale);
    }
}
