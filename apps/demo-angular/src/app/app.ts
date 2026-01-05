import { Component } from '@angular/core';
import { PdfSignAngularComponent } from '@shz/pdf-sign-angular';
import { PdfSignControl } from '@shz/pdf-sign-control';

@Component({
  imports: [PdfSignAngularComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'demo-angular';

  handleLoad(control: PdfSignControl) {
    control.load('/multipage.pdf').catch(console.error);
  }
}
