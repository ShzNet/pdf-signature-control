
import { PdfSignControl } from '@shz/pdf-sign-control';
import './styles.css';

const app = document.getElementById('root');
const container = document.createElement('div');
container.id = 'pdf-container';
app?.appendChild(container);

const control = new PdfSignControl({
    container: container,
    pdfLoaderOptions: {
        workerSrc: `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`,
        cMapUrl: `https://unpkg.com/pdfjs-dist@5.4.530/cmaps/`,
        cMapPacked: true,
    }
});

// Load a sample PDF
// Using a stable PDF from Mozilla's examples
const pdfUrl = '/multipage.pdf';

control.load(pdfUrl).catch(console.error);

(window as any).pdfControl = control;
