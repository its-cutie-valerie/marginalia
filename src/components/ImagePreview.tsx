import { useState } from 'react';
import {
    SlidersHorizontal,
    Zap,
    Trash2,
    Wand2,
    RotateCcw,
    Sun,
    Contrast,
    ZoomIn,
    ImageIcon,
    Upload,
} from 'lucide-react';
import {
    type ImageSettings,
    DEFAULT_SETTINGS,
    PRESETS,
    type PresetName,
} from '../imageProcessing';

interface ImagePreviewProps {
    image: string | null;
    processedImage: string | null;
    isProcessing: boolean;
    isApplyingSettings: boolean;
    imageSettings: ImageSettings;
    setImageSettings: (settings: ImageSettings) => void;
    onProcess: (image: string, settings: ImageSettings) => void;
    onClear: () => void;
    onApplySettings: (settings: ImageSettings) => void;
    onFileUpload: (file: File) => void;
}

const iconSize = 16;

export function ImagePreview({
    image,
    processedImage,
    isProcessing,
    isApplyingSettings,
    imageSettings,
    setImageSettings,
    onProcess,
    onClear,
    onApplySettings,
    onFileUpload,
}: ImagePreviewProps) {
    const [showSettings, setShowSettings] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) onFileUpload(file);
    };

    const applyPreset = (presetName: PresetName) => {
        const preset = PRESETS[presetName];
        setImageSettings(preset);
        onApplySettings(preset);
    };

    if (!image) {
        return (
            <div className="panel">
                <div className="panel__header">
                    <h2 className="panel__title">
                        <ImageIcon size={iconSize} />
                        Image Source
                    </h2>
                </div>
                <div className="panel__content">
                    <div
                        className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        <Upload size={iconSize} />
                        <div className="dropzone__text">
                            <p className="dropzone__title">
                                {isDragging ? 'Drop image here' : 'Drop an image, paste code, or click to upload'}
                            </p>
                            <p className="dropzone__subtitle">
                                Supports PNG, JPG, GIF, WebP
                            </p>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onFileUpload(file);
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="panel">
            <div className="panel__header">
                <h2 className="panel__title">
                    <ImageIcon size={iconSize} />
                    Image Source
                </h2>
                <button className="btn btn--secondary" onClick={onClear} title="Start with new image">
                    <Trash2 size={iconSize} />
                    Clear
                </button>
            </div>
            <div className="panel__content">
                {isProcessing && (
                    <div className="processing">
                        <div className="processing__spinner" />
                        <p className="processing__text">Extracting code from image...</p>
                    </div>
                )}

                {!isProcessing && (
                    <div className="image-preview">
                        <div className="image-preview__container">
                            <img
                                src={processedImage || image}
                                alt="Uploaded code"
                                className="image-preview__img"
                            />
                            {isApplyingSettings && (
                                <div className="image-preview__overlay">
                                    <div className="processing__spinner" />
                                </div>
                            )}
                        </div>

                        <div className="image-preview__actions">
                            <button
                                className="btn btn--secondary"
                                onClick={() => setShowSettings(!showSettings)}
                            >
                                <SlidersHorizontal size={iconSize} />
                                {showSettings ? 'Hide' : 'Tweak'}
                            </button>
                            <button
                                className="btn btn--primary"
                                onClick={() => onProcess(image, imageSettings)}
                                disabled={isApplyingSettings}
                            >
                                <Zap size={iconSize} />
                                Extract
                            </button>
                        </div>

                        {showSettings && (
                            <div className="image-settings">
                                <div className="image-settings__header">
                                    <span className="image-settings__title">
                                        <Wand2 size={iconSize} />
                                        Image Enhancement
                                    </span>
                                    <button
                                        className="btn btn--ghost"
                                        onClick={() => {
                                            setImageSettings(DEFAULT_SETTINGS);
                                            onApplySettings(DEFAULT_SETTINGS);
                                        }}
                                        title="Reset"
                                    >
                                        <RotateCcw size={iconSize} />
                                    </button>
                                </div>

                                <div className="image-settings__presets">
                                    {(Object.keys(PRESETS) as PresetName[]).map((preset) => (
                                        <button key={preset} className="preset-btn" onClick={() => applyPreset(preset)}>
                                            {preset.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </button>
                                    ))}
                                </div>

                                <div className="image-settings__controls">
                                    <div className="setting-row">
                                        <label><Sun size={iconSize} /> Brightness</label>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={imageSettings.brightness}
                                            onChange={(e) => setImageSettings({ ...imageSettings, brightness: Number(e.target.value) })}
                                        />
                                        <span className="setting-value">{imageSettings.brightness}</span>
                                    </div>

                                    <div className="setting-row">
                                        <label><Contrast size={iconSize} /> Contrast</label>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={imageSettings.contrast}
                                            onChange={(e) => setImageSettings({ ...imageSettings, contrast: Number(e.target.value) })}
                                        />
                                        <span className="setting-value">{imageSettings.contrast}</span>
                                    </div>

                                    <div className="setting-row">
                                        <label><Zap size={iconSize} /> Sharpness</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={imageSettings.sharpness}
                                            onChange={(e) => setImageSettings({ ...imageSettings, sharpness: Number(e.target.value) })}
                                        />
                                        <span className="setting-value">{imageSettings.sharpness}</span>
                                    </div>

                                    <div className="setting-row">
                                        <label><ZoomIn size={iconSize} /> Upscale</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="4"
                                            step="0.5"
                                            value={imageSettings.scale}
                                            onChange={(e) => setImageSettings({ ...imageSettings, scale: Number(e.target.value) })}
                                        />
                                        <span className="setting-value">{imageSettings.scale}x</span>
                                    </div>

                                    <div className="setting-row setting-row--toggles">
                                        <label className="toggle-label">
                                            <input
                                                type="checkbox"
                                                checked={imageSettings.grayscale}
                                                onChange={(e) => setImageSettings({ ...imageSettings, grayscale: e.target.checked })}
                                            />
                                            <span>Grayscale</span>
                                        </label>
                                        <label className="toggle-label">
                                            <input
                                                type="checkbox"
                                                checked={imageSettings.invert}
                                                onChange={(e) => setImageSettings({ ...imageSettings, invert: e.target.checked })}
                                            />
                                            <span>Invert</span>
                                        </label>
                                    </div>

                                    <div className="setting-row">
                                        <label>Threshold</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="255"
                                            value={imageSettings.threshold}
                                            onChange={(e) => setImageSettings({ ...imageSettings, threshold: Number(e.target.value) })}
                                        />
                                        <span className="setting-value">{imageSettings.threshold || 'Off'}</span>
                                    </div>
                                </div>

                                <button
                                    className="btn btn--secondary btn--full"
                                    onClick={() => onApplySettings(imageSettings)}
                                    disabled={isApplyingSettings}
                                >
                                    {isApplyingSettings ? 'Applying...' : 'Preview Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
