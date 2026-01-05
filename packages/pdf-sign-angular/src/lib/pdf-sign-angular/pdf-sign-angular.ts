
import { Component, ElementRef, ViewChild, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfSignControl, PdfSignControlOptions } from '@shz/pdf-sign-control';

@Component({
  selector: 'lib-pdf-sign-angular',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-sign-angular.html',
  styleUrl: './pdf-sign-angular.css',
})
export class PdfSignAngularComponent implements OnInit, OnDestroy {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;
  @Input() options: Omit<PdfSignControlOptions, 'container'> = {};
  @Input() onLoad?: (control: PdfSignControl) => void;

  private control: PdfSignControl | null = null;

  ngOnInit() {
    if (this.container) {
      this.control = new PdfSignControl({
        ...this.options,
        container: this.container.nativeElement,
      });

      if (this.onLoad) {
        this.onLoad(this.control);
      }
    }
  }

  ngOnDestroy() {
    if (this.control) {
      this.control.destroy();
      this.control = null;
    }
  }

  getControl() {
    return this.control;
  }
}
