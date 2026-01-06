
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

  onControlReady(control: PdfSignControl) {
    console.log('PDF Control ready:', control);
  }

  onPageChange(data: { page: number; total: number }) {
    this.pageInfo = `${data.page} / ${data.total}`;
  }

  onScaleChange(data: { scale: number }) {
    this.zoomInfo = `${Math.round(data.scale * 100)}%`;
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
