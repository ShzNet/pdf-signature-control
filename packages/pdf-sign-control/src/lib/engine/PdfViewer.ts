import { EventBus } from '../utils/EventBus.js';
import { ZoomHandler } from '../utils/ZoomHandler.js';
import { PdfLoader, PDFDocumentProxy } from './PdfLoader.js';
import { PdfLoaderOptions, ViewMode, SignatureField } from '../types.js';
import { IViewModeStrategy } from '../strategies/IViewModeStrategy.js';
import { SinglePageStrategy } from '../strategies/SinglePageStrategy.js';
import { ScrollStrategy } from '../strategies/ScrollStrategy.js';

export interface PdfViewerOptions {
    container: HTMLElement;
    pdfLoaderOptions?: PdfLoaderOptions;
    viewMode?: ViewMode;
}

export class PdfViewer {
    private container: HTMLElement;
    private eventBus: EventBus;
    private loader: PdfLoader;
    private zoomHandler: ZoomHandler;
    private pdfDocument: PDFDocumentProxy | null = null;
    private strategy: IViewModeStrategy | null = null;
    private currentViewMode: ViewMode;

    private currentScale = 1.0;

    constructor(options: PdfViewerOptions) {
        this.container = options.container;
        this.eventBus = new EventBus();
        this.loader = new PdfLoader(options.pdfLoaderOptions);
        this.currentViewMode = options.viewMode ?? 'scroll';

        // Initialize zoom handler for gesture-based zoom
        this.zoomHandler = new ZoomHandler({
            container: this.container,
            getScale: () => this.getScale(),
            setScale: (scale) => this.setScale(scale)
        });
        this.zoomHandler.init();
    }

    async load(source: string | Uint8Array | ArrayBuffer): Promise<void> {
        try {
            this.pdfDocument = await this.loader.loadDocument(source);
            this.eventBus.emit('document:loaded', this.pdfDocument);
            console.log('PDF Loaded, pages:', this.pdfDocument?.numPages);

            await this.initStrategy();
        } catch (error) {
            this.eventBus.emit('error', error);
            throw error;
        }
    }

    private async initStrategy(): Promise<void> {
        if (!this.pdfDocument) return;

        if (this.strategy) {
            this.strategy.destroy();
        }

        this.strategy = this.createStrategy(this.currentViewMode);
        await this.strategy.init(this.container, this.pdfDocument, this.eventBus, this.currentScale);
        if (this.fields.length > 0) {
            this.strategy.setFields(this.fields);
        }
    }

    private createStrategy(mode: ViewMode): IViewModeStrategy {
        switch (mode) {
            case 'single':
                return new SinglePageStrategy();
            case 'scroll':
            default:
                return new ScrollStrategy();
        }
    }

    async setViewMode(mode: ViewMode): Promise<void> {
        if (mode === this.currentViewMode) return;

        this.currentViewMode = mode;
        if (this.pdfDocument) {
            await this.initStrategy();
        }
    }

    getViewMode(): ViewMode {
        return this.currentViewMode;
    }

    goToPage(page: number): void {
        this.strategy?.goToPage(page);
    }

    nextPage(): void {
        this.strategy?.nextPage();
    }

    previousPage(): void {
        this.strategy?.previousPage();
    }

    getCurrentPage(): number {
        return this.strategy?.getCurrentPage() ?? 1;
    }

    getTotalPages(): number {
        return this.strategy?.getTotalPages() ?? 0;
    }

    setScale(scale: number): void {
        this.currentScale = scale;
        this.strategy?.setScale(scale);
    }

    getScale(): number {
        return this.currentScale;
    }

    // Field Management

    private fields: SignatureField[] = [];

    setFields(fields: SignatureField[]): void {
        this.fields = fields;
        this.strategy?.setFields(fields);
    }

    getFields(): SignatureField[] {
        return this.fields;
    }

    addField(field: SignatureField): void {
        this.fields.push(field);
        this.strategy?.setFields(this.fields);
    }

    removeField(fieldId: string): void {
        this.fields = this.fields.filter(f => f.id !== fieldId);
        this.strategy?.setFields(this.fields);
    }

    updateField(fieldId: string, updates: Partial<SignatureField>): void {
        const index = this.fields.findIndex(f => f.id === fieldId);
        if (index !== -1) {
            this.fields[index] = { ...this.fields[index], ...updates };
            this.strategy?.setFields(this.fields);
        }
    }

    on(event: string, handler: (data: any) => void) {
        this.eventBus.on(event, handler);
    }

    off(event: string, handler: (data: any) => void) {
        this.eventBus.off(event, handler);
    }

    destroy() {
        this.zoomHandler.destroy();
        this.strategy?.destroy();
        this.loader.destroy();
        this.eventBus.clear();
        this.container.innerHTML = '';
    }
}
