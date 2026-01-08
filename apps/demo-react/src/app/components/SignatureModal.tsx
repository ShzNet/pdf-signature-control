import React, { useState, useEffect, useRef } from 'react';
import SignaturePad from 'signature_pad';
import { SignatureGenerator, SignatureConfig } from '../signature-generator';
import { SignaturePreview } from './SignaturePreview';

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (htmlContent: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    // State
    const [activeTab, setActiveTab] = useState<'drawing' | 'certName' | 'image'>('drawing');
    const [sigLayout, setSigLayout] = useState<'horizontal' | 'vertical'>('horizontal');
    const [sigFontSize, setSigFontSize] = useState(5);
    const [infoLines, setInfoLines] = useState<string[]>(['Signed by: Alice', 'Date:']);
    const [certName, setCertName] = useState('');
    const [drawingColor, setDrawingColor] = useState('#2563eb');
    const [penWidth, setPenWidth] = useState(1);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Refs
    const sigCanvasRef = useRef<HTMLCanvasElement>(null);
    const sigPadRef = useRef<SignaturePad | null>(null);

    // Force update for ref changes or canvas drawing
    const [, setTick] = useState(0);

    // Helper
    const getVisualContent = (): string => {
        if (activeTab === 'certName') return certName || 'Your Name';
        if (activeTab === 'image') return selectedImage || '';
        if (activeTab === 'drawing') return sigPadRef.current?.toDataURL() || '';
        return '';
    };

    // Derived Config
    const config: SignatureConfig = {
        layout: sigLayout,
        fontSize: sigFontSize,
        infoLines: [...infoLines],
        visualType: activeTab === 'image' ? 'image' : (activeTab === 'certName' ? 'text' : 'drawing'),
        visualContent: getVisualContent()
    };

    const updatePreview = () => {
        setTick(t => t + 1);
    };

    // Initialize Signature Pad
    useEffect(() => {
        if (isOpen && activeTab === 'drawing' && sigCanvasRef.current) {
            setTimeout(() => {
                if (!sigCanvasRef.current) return;

                if (!sigPadRef.current) {
                    sigPadRef.current = new SignaturePad(sigCanvasRef.current, {
                        backgroundColor: 'rgba(255, 255, 255, 0)',
                        penColor: drawingColor,
                        minWidth: penWidth,
                        maxWidth: penWidth * 2.5
                    });

                    sigPadRef.current.addEventListener('endStroke', () => updatePreview());
                }

                const canvas = sigCanvasRef.current;
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                canvas.getContext('2d')?.scale(ratio, ratio);

                sigPadRef.current.clear();
                updatePreview();
            }, 50);
        }
    }, [isOpen, activeTab]);

    // Update Pen Style
    useEffect(() => {
        if (sigPadRef.current) {
            sigPadRef.current.penColor = drawingColor;
            sigPadRef.current.minWidth = penWidth;
            sigPadRef.current.maxWidth = penWidth * 2.5;
        }
    }, [drawingColor, penWidth]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setSelectedImage(ev.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleConfirm = () => {
        // Validate
        if (activeTab === 'drawing' && sigPadRef.current?.isEmpty()) {
            alert('Please draw a signature first.');
            return;
        }
        if (activeTab === 'certName' && !certName.trim()) {
            alert('Please enter a name.');
            return;
        }
        if (activeTab === 'image' && !selectedImage) {
            alert('Please select an image.');
            return;
        }

        const generator = new SignatureGenerator();
        const html = generator.generate(config);
        onConfirm(html);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content sig-modal">
                <div className="sig-modal-header">
                    <h3>Signature Configuration</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="sig-modal-body">
                    <div className="sig-modal-content">
                        <div className="sig-left-panel">
                            <div className="sig-tabs">
                                <div className={`sig-tab ${activeTab === 'drawing' ? 'active' : ''}`} onClick={() => setActiveTab('drawing')}>Draw</div>
                                <div className={`sig-tab ${activeTab === 'certName' ? 'active' : ''}`} onClick={() => setActiveTab('certName')}>Name</div>
                                <div className={`sig-tab ${activeTab === 'image' ? 'active' : ''}`} onClick={() => setActiveTab('image')}>Image</div>
                            </div>

                            {/* Drawing */}
                            <div className={`tab-content ${activeTab !== 'drawing' ? 'hidden' : ''}`}>
                                <div className="signature-pad-container">
                                    <canvas ref={sigCanvasRef} className="signature-pad"></canvas>
                                </div>
                                <div className="sig-controls">
                                    <div className="control-row">
                                        <button className={`color-btn ${drawingColor === '#2563eb' ? 'active' : ''}`} style={{ background: '#2563eb' }} onClick={() => setDrawingColor('#2563eb')}></button>
                                        <button className={`color-btn ${drawingColor === '#1f2937' ? 'active' : ''}`} style={{ background: '#1f2937' }} onClick={() => setDrawingColor('#1f2937')}></button>
                                        <button className={`color-btn ${drawingColor === '#dc2626' ? 'active' : ''}`} style={{ background: '#dc2626' }} onClick={() => setDrawingColor('#dc2626')}></button>
                                    </div>
                                    <div className="control-row">
                                        <span className="control-label" style={{ marginRight: '10px', fontSize: '13px', color: '#6b7280' }}>Stroke</span>
                                        <button className={`pen-btn ${penWidth === 1 ? 'active' : ''}`} onClick={() => setPenWidth(1)} style={{ width: '8px', height: '8px' }}></button>
                                        <button className={`pen-btn ${penWidth === 2.5 ? 'active' : ''}`} onClick={() => setPenWidth(2.5)} style={{ width: '12px', height: '12px', marginLeft: '10px' }}></button>
                                    </div>
                                </div>
                            </div>

                            {/* Name */}
                            <div className={`tab-content ${activeTab !== 'certName' ? 'hidden' : ''}`}>
                                <div className="certname-input-container">
                                    <input type="text" className="certname-input" placeholder="Enter your name" value={certName} onChange={e => setCertName(e.target.value)} />
                                </div>
                            </div>

                            {/* Image */}
                            <div className={`tab-content ${activeTab !== 'image' ? 'hidden' : ''}`}>
                                <div className="image-upload-container" onClick={() => document.getElementById('react-sig-upload')?.click()}>
                                    <input type="file" id="react-sig-upload" hidden accept="image/*" onChange={handleImageUpload} />
                                    {selectedImage ? (
                                        <div className="image-preview"><img src={selectedImage} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /></div>
                                    ) : (
                                        <div className="upload-placeholder">
                                            <div className="upload-icon">☁️</div>
                                            <div>Click to upload</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="option-group" style={{ marginTop: '20px' }}>
                                <div className="option-label">Layout</div>
                                <div className="toggle-group">
                                    <button className={`toggle-btn ${sigLayout === 'horizontal' ? 'active' : ''}`} onClick={() => setSigLayout('horizontal')}>Horizontal</button>
                                    <button className={`toggle-btn ${sigLayout === 'vertical' ? 'active' : ''}`} onClick={() => setSigLayout('vertical')}>Vertical</button>
                                </div>
                            </div>
                        </div>

                        <div className="sig-right-panel">
                            <div className="option-group">
                                <div className="option-label">Display Content</div>
                                <div className="info-lines-list">
                                    {infoLines.map((line, i) => (
                                        <div key={i} className="info-line-item">
                                            <input type="text" className="info-line-input" value={line} onChange={e => {
                                                const newLines = [...infoLines];
                                                newLines[i] = e.target.value;
                                                setInfoLines(newLines);
                                            }} />
                                            <button className="remove-line-btn" onClick={() => setInfoLines(infoLines.filter((_, idx) => idx !== i))}>×</button>
                                        </div>
                                    ))}
                                    <button className="add-line-btn" onClick={() => setInfoLines([...infoLines, ''])}>+ Add Line</button>
                                </div>
                            </div>

                            <div className="option-group">
                                <div className="option-label">Font Size</div>
                                <input type="range" min="3" max="9" className="slider" value={sigFontSize} onChange={e => setSigFontSize(parseInt(e.target.value))} />
                            </div>

                            <div className="option-group">
                                <div className="option-label">Preview</div>
                                <div className="sig-preview">
                                    <SignaturePreview config={config} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="sig-confirm-btn" onClick={handleConfirm}>Confirm</button>
                </div>
            </div>
        </div>
    );
};
