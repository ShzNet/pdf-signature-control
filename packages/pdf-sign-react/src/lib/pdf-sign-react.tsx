import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { PdfSignControl, PdfSignControlOptions } from '@shz/pdf-sign-control';

export interface PdfSignReactProps extends Omit<PdfSignControlOptions, 'container'> {
  className?: string;
  style?: React.CSSProperties;
  onLoad?: (control: PdfSignControl) => void;
}

export const PdfSignReact = forwardRef<PdfSignControl | null, PdfSignReactProps>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<PdfSignControl | null>(null);

  useImperativeHandle(ref, () => controlRef.current as PdfSignControl);

  useEffect(() => {
    if (!containerRef.current || controlRef.current) return;

    controlRef.current = new PdfSignControl({
      ...props,
      container: containerRef.current,
    });

    if (props.onLoad) {
      props.onLoad(controlRef.current);
    }

    return () => {
      controlRef.current?.destroy();
      controlRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className={props.className} style={{ width: '100%', height: '100%', ...props.style }} />;
});
