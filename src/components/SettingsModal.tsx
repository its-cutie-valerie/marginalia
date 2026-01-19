import React from 'react';
import { Modal } from './Modal';
import { Sun, Moon, Ghost, Snowflake, Terminal, Box, Zap, Cat, Settings as SettingsIcon, History } from 'lucide-react';

export type ThemeName =
    | 'dark' | 'light'
    | 'dracula' | 'nord' | 'monokai' | 'solarized-dark' | 'gruvbox' | 'synthwave' | 'catppuccin'
    | 'nord-light' | 'monokai-light' | 'solarized-light' | 'gruvbox-light' | 'catppuccin-latte';

interface ThemeOption {
    name: ThemeName;
    label: string;
    icon: React.ReactNode;
    color: string;
}

const THEMES: { category: string; options: ThemeOption[] }[] = [
    {
        category: 'Classic',
        options: [
            { name: 'dark', label: 'Dark', icon: <Moon size={16} />, color: '#8b5cf6' },
            { name: 'light', label: 'Light', icon: <Sun size={16} />, color: '#7c3aed' },
        ]
    },
    {
        category: 'Programming (Dark)',
        options: [
            { name: 'dracula', label: 'Dracula', icon: <Ghost size={16} />, color: '#bd93f9' },
            { name: 'nord', label: 'Nord', icon: <Snowflake size={16} />, color: '#88c0d0' },
            { name: 'monokai', label: 'Monokai', icon: <Terminal size={16} />, color: '#a6e22e' },
            { name: 'solarized-dark', label: 'Solarized', icon: <Sun size={16} />, color: '#b58900' },
            { name: 'gruvbox', label: 'Gruvbox', icon: <Box size={16} />, color: '#fe8019' },
            { name: 'synthwave', label: 'Synthwave', icon: <Zap size={16} />, color: '#ff00ba' },
            { name: 'catppuccin', label: 'Catppuccin', icon: <Cat size={16} />, color: '#cba6f7' },
        ]
    },
    {
        category: 'Programming (Light)',
        options: [
            { name: 'nord-light', label: 'Nord Light', icon: <Snowflake size={16} />, color: '#5e81ac' },
            { name: 'monokai-light', label: 'Monokai Light', icon: <Terminal size={16} />, color: '#f92672' },
            { name: 'solarized-light', label: 'Solarized Light', icon: <Sun size={16} />, color: '#2aa198' },
            { name: 'gruvbox-light', label: 'Gruvbox Light', icon: <Box size={16} />, color: '#af3a03' },
            { name: 'catppuccin-latte', label: 'Catppuccin Latte', icon: <Cat size={16} />, color: '#8839ef' },
        ]
    }
];

export interface AppPreferences {
    saveHistory: boolean;
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: ThemeName;
    setTheme: (theme: ThemeName) => void;
    preferences: AppPreferences;
    onUpdatePreference: (key: keyof AppPreferences, value: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    theme,
    setTheme,
    preferences,
    onUpdatePreference
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <SettingsIcon size={20} /> Settings
                </span>
            }
        >
            <div className="settings-modal" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Workflow Section */}
                <section>
                    <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Workflow
                    </h3>
                    <div className="preferences-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                        <label className="preference-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <History size={18} style={{ color: 'var(--primary)' }} />
                                <div>
                                    <div style={{ fontWeight: 500 }}>Save to History</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Keep a log of extracted snippets</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.saveHistory}
                                onChange={(e) => onUpdatePreference('saveHistory', e.target.checked)}
                                style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                            />
                        </label>

                    </div>
                </section>

                <section>
                    <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Themes
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {THEMES.map((cat) => (
                            <div key={cat.category}>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                                    {cat.category}
                                </h4>
                                <div className="theme-grid" style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                    gap: '0.75rem'
                                }}>
                                    {cat.options.map((option) => (
                                        <button
                                            key={option.name}
                                            onClick={() => setTheme(option.name)}
                                            className={`theme-btn ${theme === option.name ? 'active' : ''}`}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.75rem',
                                                borderRadius: 'var(--radius-md)',
                                                border: theme === option.name ? `2px solid ${option.color}` : '2px solid transparent',
                                                background: 'var(--bg-secondary)',
                                                color: theme === option.name ? option.color : 'var(--text-muted)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <div style={{ color: option.color }}>{option.icon}</div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </Modal>
    );
};
