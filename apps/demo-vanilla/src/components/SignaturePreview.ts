import { SignatureConfig, SignatureGenerator } from '../signature-generator';

export class SignaturePreview {
    private generator = new SignatureGenerator();

    constructor(private container: HTMLElement) { }

    render(config: SignatureConfig) {
        const html = this.generator.generate(config);
        this.container.innerHTML = '';

        // Create iframe for isolation and style
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.pointerEvents = 'none'; // Prevent interaction
        iframe.title = 'Signature Preview';
        iframe.srcdoc = html;

        this.container.appendChild(iframe);
    }

    clear() {
        this.container.innerHTML = '';
    }
}
