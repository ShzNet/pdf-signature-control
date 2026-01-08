import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SignatureConfig, SignatureGenerator } from '../../signature-generator';

@Component({
    selector: 'app-signature-preview',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="preview-container">
      <iframe [srcdoc]="safeHtml" title="Signature Preview"></iframe>
    </div>
  `,
    styles: [`
    .preview-container {
      width: 100%;
      height: 100%;
      overflow: hidden;
      border: 1px dotted #ccc;
      background: #fff;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
      pointer-events: none; /* Prevent interaction with iframe content */
    }
  `]
})
export class SignaturePreviewComponent implements OnChanges {
    @Input() config?: SignatureConfig;

    safeHtml: SafeHtml = '';
    private sigGen = new SignatureGenerator();

    constructor(private sanitizer: DomSanitizer) { }

    ngOnChanges(): void {
        if (this.config) {
            const html = this.sigGen.generate(this.config);
            this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(html);
        } else {
            this.safeHtml = '';
        }
    }
}
