import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as pdfjsLib from 'pdfjs-dist';
import { PdfLoader } from './PdfLoader.js';

vi.mock('pdfjs-dist', () => ({
    getDocument: vi.fn(),
    GlobalWorkerOptions: { workerSrc: '' },
    version: '5.4.530',
}));

describe('PdfLoader', () => {
    const document = { destroy: vi.fn() };
    const options = {
        workerSrc: '/pdfjs/pdf.worker.min.mjs',
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: false,
        wasmUrl: '/pdfjs/wasm/',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(pdfjsLib.getDocument).mockReturnValue({
            promise: Promise.resolve(document),
        } as unknown as ReturnType<typeof pdfjsLib.getDocument>);
    });

    it.each([
        ['URL', 'https://example.com/document.pdf'],
        ['Uint8Array', new Uint8Array([37, 80, 68, 70])],
        ['ArrayBuffer', new ArrayBuffer(4)],
    ] as const)('forwards decoder options when loading a %s', async (_, source) => {
        const loader = new PdfLoader(options);

        expect(await loader.loadDocument(source)).toBe(document);
        expect(pdfjsLib.GlobalWorkerOptions.workerSrc).toBe(options.workerSrc);
        expect(pdfjsLib.getDocument).toHaveBeenCalledExactlyOnceWith({
            cMapUrl: options.cMapUrl,
            cMapPacked: false,
            wasmUrl: options.wasmUrl,
            ...(typeof source === 'string' ? { url: source } : { data: source }),
        });
        expect(loader.getDocument()).toBe(document);
    });

    it('preserves loading without options and the version-matched default worker', async () => {
        const loader = new PdfLoader();

        expect(loader.getDocument()).toBeNull();
        await loader.loadDocument('/document.pdf');

        expect(pdfjsLib.getDocument).toHaveBeenCalledExactlyOnceWith({ url: '/document.pdf' });
        expect(pdfjsLib.GlobalWorkerOptions.workerSrc).toBe(
            `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`,
        );
    });

    it('keeps decoder options separate for each loader', async () => {
        const first = new PdfLoader(options);
        const second = new PdfLoader({ wasmUrl: '/other/wasm/' });

        await first.loadDocument('/first.pdf');
        await second.loadDocument('/second.pdf');

        expect(pdfjsLib.getDocument).toHaveBeenLastCalledWith({
            wasmUrl: '/other/wasm/',
            url: '/second.pdf',
        });
    });

    it('reports and rethrows loading errors', async () => {
        const error = new Error('Invalid PDF');
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(pdfjsLib.getDocument).mockReturnValue({
            promise: Promise.reject(error),
        } as unknown as ReturnType<typeof pdfjsLib.getDocument>);

        try {
            await expect(new PdfLoader(options).loadDocument('/invalid.pdf')).rejects.toBe(error);
            expect(consoleError).toHaveBeenCalledWith('Error loading PDF document:', error);
        } finally {
            consoleError.mockRestore();
        }
    });

    it('destroys the loaded document once and clears the reference', async () => {
        const loader = new PdfLoader(options);
        await loader.loadDocument('/document.pdf');

        loader.destroy();
        loader.destroy();

        expect(document.destroy).toHaveBeenCalledTimes(1);
        expect(loader.getDocument()).toBeNull();
    });
});
