
import { Component, ViewChild } from '@angular/core';
import { PdfSignAngularComponent } from '@shz/pdf-sign-angular';
import { PdfSignControl, PdfSignControlOptions, ViewMode } from '@shz/pdf-sign-control';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, PdfSignAngularComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  @ViewChild(PdfSignAngularComponent) pdfComponent!: PdfSignAngularComponent;

  pdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
  viewMode: ViewMode = 'scroll';

  pageInfo = '1 / ?';
  zoomInfo = '100%';
  currentDate = new Date().toLocaleDateString();

  pdfLoaderOptions: PdfSignControlOptions['pdfLoaderOptions'] = {
    workerSrc: 'https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs',
    cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.530/cmaps/',
    cMapPacked: true
  };

  fields: any[] = [];

  onControlReady(control: PdfSignControl) {
    console.log('PDF Control ready:', control);
  }

  onPageChange(data: { page: number; total: number }) {
    this.pageInfo = `${data.page} / ${data.total}`;
  }

  onScaleChange(data: { scale: number }) {
    this.zoomInfo = `${Math.round(data.scale * 100)}%`;
  }

  onFieldsChange(fields: any[]) {
    console.log('Demo: onFieldsChange', fields);
    this.fields = fields;
    // Note: In Angular, if we update the same reference, change detection might catch it 
    // depending on strategy. But 'fields' from event is usually a new array or mutated array.
    // If loop occurs, we might need checks.
  }

  addExternalField() {
    const externalField = {
      id: `ext-${Date.now()}`,
      pageIndex: 0,
      rect: { x: 50, y: 50, width: 100, height: 50 },
      type: 'text',
      content: 'External Field (NG)',
      draggable: true,
      resizable: true,
      deletable: true,
      style: { border: '2px dashed blue', backgroundColor: 'rgba(0,0,255,0.1)' }
    };

    // We must create a NEW array reference to trigger ngOnChanges in the child component if using OnPush
    // or to ensure @Input change is detected.
    this.fields = [...this.fields, externalField];
  }

  onError(error: Error) {
    console.error('PDF Error:', error);
  }

  // Navigation handlers
  prevPage() {
    this.pdfComponent?.previousPage();
  }

  nextPage() {
    this.pdfComponent?.nextPage();
  }

  // Zoom handlers  
  zoomIn() {
    const currentScale = this.pdfComponent?.getScale() ?? 1;
    this.pdfComponent?.setScale(currentScale + 0.25);
  }

  zoomOut() {
    const currentScale = this.pdfComponent?.getScale() ?? 1;
    this.pdfComponent?.setScale(currentScale - 0.25);
  }
}
