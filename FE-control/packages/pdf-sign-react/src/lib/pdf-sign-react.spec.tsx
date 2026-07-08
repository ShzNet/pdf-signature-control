import { render } from '@testing-library/react';

import { PdfSignReact } from './pdf-sign-react';
describe('PdfSignReact', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<PdfSignReact />);
    expect(baseElement).toBeTruthy();
  });
});
