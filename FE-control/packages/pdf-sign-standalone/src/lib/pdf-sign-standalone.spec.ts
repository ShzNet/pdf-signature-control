import { pdfSignStandalone } from './pdf-sign-standalone.js';

describe('pdfSignStandalone', () => {
  it('should work', () => {
    expect(pdfSignStandalone()).toEqual('pdf-sign-standalone');
  });
});
