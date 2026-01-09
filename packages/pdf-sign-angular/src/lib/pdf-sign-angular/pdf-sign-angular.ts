
import { Component, ElementRef, ViewChild, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfSignControl, PdfSignControlOptions, ViewMode, SignatureField } from '@shznet/pdf-sign-control';

@Component({
  selector: 'lib-pdf-sign-angular',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-sign-angular.html',
  styleUrl: './pdf-sign-angular.css',
})
export class PdfSignAngularComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;

  /** PDF source URL or ArrayBuffer - auto-loads when provided */
  @Input() src?: string | Uint8Array | ArrayBuffer;

  /** Initial view mode: 'scroll' or 'single' */
  @Input() viewMode?: ViewMode;

  /** Initial fields */
  @Input() fields?: SignatureField[];

  /** PDF.js loader options */
  @Input() pdfLoaderOptions?: PdfSignControlOptions['pdfLoaderOptions'];

  /** Emitted when control is ready */
  @Output() ready = new EventEmitter<PdfSignControl>();

  /** Emitted when PDF is loaded */
  @Output() loaded = new EventEmitter<void>();

  /** Emitted when page changes */
  @Output() pageChange = new EventEmitter<{ page: number; total: number }>();

  /** Emitted when scale changes */
  @Output() scaleChange = new EventEmitter<{ scale: number }>();

  /** Emitted on error */
  @Output() error = new EventEmitter<Error>();

  /** Emitted when a field is added */
  @Output() fieldAdd = new EventEmitter<SignatureField>();

  /** Emitted when a field is removed */
  @Output() fieldRemove = new EventEmitter<{ fieldId: string }>();

  /** Emitted when a field is updated */
  @Output() fieldUpdate = new EventEmitter<{ fieldId: string, updates: Partial<SignatureField> }>();

  /** Emitted when any field changes (add/remove/update) */
  @Output() fieldsChange = new EventEmitter<SignatureField[]>();

  private control: PdfSignControl | null = null;

  ngOnInit() {
    if (this.container) {
      this.control = new PdfSignControl({
        container: this.container.nativeElement,
        viewMode: this.viewMode,
        pdfLoaderOptions: this.pdfLoaderOptions,
        fields: this.fields
      });

      // Setup event listeners
      this.control.on('page:change', (data: { page: number; total: number }) => {
        this.pageChange.emit(data);
      });

      this.control.on('scale:change', (data: { scale: number }) => {
        this.scaleChange.emit(data);
      });

      // Field Events
      this.control.on('field:add', (field: SignatureField) => {
        this.fieldAdd.emit(field);
      });
      this.control.on('field:remove', (data: { fieldId: string }) => {
        this.fieldRemove.emit(data);
      });
      this.control.on('field:update', (data: { fieldId: string, updates: Partial<SignatureField> }) => {
        this.fieldUpdate.emit(data);
      });
      this.control.on('fields:change', (fields: SignatureField[]) => {
        this.fieldsChange.emit(fields);
      });

      this.ready.emit(this.control);

      // Auto-load if src provided
      if (this.src) {
        this.loadPdf(this.src);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['src'] && !changes['src'].firstChange && this.src) {
      this.loadPdf(this.src);
    }
    if (changes['viewMode'] && !changes['viewMode'].firstChange && this.viewMode) {
      this.control?.setViewMode(this.viewMode);
    }
    if (changes['fields'] && !changes['fields'].firstChange && this.fields) {
      const currentFields = this.control?.getFields();
      if (JSON.stringify(currentFields) === JSON.stringify(this.fields)) {
        return;
      }
      this.control?.setFields(this.fields);
    }
  }

  ngOnDestroy() {
    if (this.control) {
      this.control.destroy();
      this.control = null;
    }
  }

  private loadPdf(source: string | Uint8Array | ArrayBuffer) {
    this.control?.load(source)
      .then(() => this.loaded.emit())
      .catch((err) => this.error.emit(err));
  }

  // Public API methods

  /** Get the underlying PdfSignControl instance */
  getControl(): PdfSignControl | null {
    return this.control;
  }

  /** Load a PDF from URL or ArrayBuffer */
  load(source: string | Uint8Array | ArrayBuffer): Promise<void> {
    return this.control?.load(source) ?? Promise.reject('Control not initialized');
  }

  /** Navigate to specific page */
  goToPage(page: number): void {
    this.control?.goToPage(page);
  }

  /** Go to next page */
  nextPage(): void {
    this.control?.nextPage();
  }

  /** Go to previous page */
  previousPage(): void {
    this.control?.previousPage();
  }

  /** Get current page number */
  getCurrentPage(): number {
    return this.control?.getCurrentPage() ?? 1;
  }

  /** Get total pages */
  getTotalPages(): number {
    return this.control?.getTotalPages() ?? 0;
  }

  /** Set zoom scale */
  setScale(scale: number): void {
    this.control?.setScale(scale);
  }

  /** Get current zoom scale */
  getScale(): number {
    return this.control?.getScale() ?? 1.0;
  }

  /** Set view mode */
  setViewMode(mode: ViewMode): Promise<void> {
    return this.control?.setViewMode(mode) ?? Promise.resolve();
  }

  /** Get current view mode */
  getViewMode(): ViewMode {
    return this.control?.getViewMode() ?? 'scroll';
  }

  /** Print the PDF */
  print(options?: { withSignatures?: boolean }): Promise<void> {
    return this.control?.print(options) ?? Promise.resolve();
  }

  // Field Management Wrappers

  addField(field: any): void {
    this.control?.addField(field);
  }

  removeField(fieldId: string): void {
    this.control?.removeField(fieldId);
  }

  updateField(fieldId: string, updates: any): void {
    this.control?.updateField(fieldId, updates);
  }

  setFields(fields: any[]): void {
    this.control?.setFields(fields);
  }
}
