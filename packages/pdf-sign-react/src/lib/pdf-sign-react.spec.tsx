import { render } from '@testing-library/react';

import ShzPdfSignReact from './pdf-sign-react';

describe('ShzPdfSignReact', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ShzPdfSignReact />);
    expect(baseElement).toBeTruthy();
  });
});
