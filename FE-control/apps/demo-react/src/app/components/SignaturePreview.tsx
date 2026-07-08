import React, { useMemo } from 'react';
import { SignatureConfig, SignatureGenerator } from '../signature-generator';

interface SignaturePreviewProps {
    config?: SignatureConfig;
}

const sigGen = new SignatureGenerator();

export const SignaturePreview: React.FC<SignaturePreviewProps> = ({ config }) => {
    const html = useMemo(() => {
        if (!config) return '';
        return sigGen.generate(config);
    }, [config]);

    if (!html) {
        return null;
    }

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', border: '1px dotted #ccc', background: '#fff' }}>
            <iframe
                srcDoc={html}
                style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                title="Signature Preview"
            />
        </div>
    );
};
