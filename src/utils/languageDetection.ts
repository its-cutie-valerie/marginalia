
// Language detection patterns with weights (higher = more specific)
export const LANGUAGE_PATTERNS: Record<string, { patterns: RegExp[]; weight: number }> = {
    // TSX/JSX must be checked BEFORE HTML
    typescriptreact: {
        patterns: [
            /import\s+.*from\s+['"]react['"]/,
            /import\s+\{.*useState.*\}/,
            /import\s+\{.*useEffect.*\}/,
            /<\w+\s+className=/,
            /:\s*React\.(FC|Component)/,
            /useState<\w+>/,
            /useCallback|useMemo|useRef|useContext/,
            /return\s*\(\s*</,
            /export\s+(default\s+)?function\s+\w+/,
        ],
        weight: 4,
    },
    javascriptreact: {
        patterns: [
            /import\s+React/,
            /from\s+['"]react['"]/,
            /<\w+\s+className=/,
            /React\.createElement/,
            /const\s+\[\w+,\s*set\w+\]\s*=\s*useState/,
        ],
        weight: 3,
    },
    typescript: {
        patterns: [
            /:\s*(string|number|boolean|any|void|never|unknown)\b/,
            /interface\s+\w+\s*\{/,
            /type\s+\w+\s*=/,
            /<\w+>\s*\(/,
            /as\s+(string|number|boolean|const)/,
            /:\s*\w+\[\]/,
            /enum\s+\w+/,
        ],
        weight: 2,
    },
    python: {
        patterns: [
            /^(import|from)\s+\w+/m,
            /def\s+\w+\s*\([^)]*\)\s*:/,
            /class\s+\w+.*:/,
            /print\s*\(/,
            /self\.\w+/,
            /__init__|__name__/,
            /if\s+__name__\s*==\s*['"]__main__['"]/,
        ],
        weight: 2,
    },
    javascript: {
        patterns: [
            /\bconst\s+\w+\s*=/,
            /\blet\s+\w+\s*=/,
            /\bvar\s+\w+\s*=/,
            /=>\s*[{(]/,
            /function\s+\w+\s*\(/,
            /\bconsole\.(log|error|warn)/,
            /require\s*\(/,
            /module\.exports/,
            /export\s+(default\s+)?/,
        ],
        weight: 1,
    },
    java: {
        patterns: [
            /public\s+(class|static|void)/,
            /private\s+\w+/,
            /System\.out\.print/,
            /new\s+\w+\(/,
            /extends\s+\w+/,
            /implements\s+\w+/,
            /@Override/,
        ],
        weight: 2,
    },
    cpp: {
        patterns: [
            /#include\s*<\w+>/,
            /std::/,
            /cout\s*<</,
            /cin\s*>>/,
            /int\s+main\s*\(/,
            /nullptr/,
            /using\s+namespace/,
        ],
        weight: 2,
    },
    c: {
        patterns: [
            /#include\s*<\w+\.h>/,
            /printf\s*\(/,
            /scanf\s*\(/,
            /int\s+main\s*\(/,
            /malloc\s*\(/,
            /free\s*\(/,
        ],
        weight: 2,
    },
    csharp: {
        patterns: [
            /using\s+System/,
            /namespace\s+\w+/,
            /public\s+class\s+\w+/,
            /Console\.(WriteLine|ReadLine)/,
            /async\s+Task/,
        ],
        weight: 2,
    },
    rust: {
        patterns: [
            /fn\s+\w+/,
            /let\s+(mut\s+)?\w+/,
            /impl\s+\w+/,
            /pub\s+(fn|struct|enum)/,
            /println!\s*\(/,
            /use\s+\w+::/,
        ],
        weight: 2,
    },
    go: {
        patterns: [
            /package\s+\w+/,
            /func\s+\w+/,
            /import\s+\(/,
            /fmt\.(Print|Println)/,
            /:=\s*/,
        ],
        weight: 2,
    },
    html: {
        patterns: [
            /<!DOCTYPE\s+html/i,
            /<html\b/i,
            /<head\b/i,
            /<body\b/i,
            /class="[^"]*"/,
        ],
        weight: 1, // Lower weight so TSX/JSX are preferred
    },
    css: {
        patterns: [
            /\.\w+\s*\{/,
            /#\w+\s*\{/,
            /:\s*(flex|grid|block|none)/,
            /(margin|padding|border|background)\s*:/,
            /@media\s+/,
        ],
        weight: 2,
    },
    sql: {
        patterns: [
            /\b(SELECT|INSERT|UPDATE|DELETE)\s+/i,
            /\bFROM\s+\w+/i,
            /\bWHERE\s+/i,
            /CREATE\s+(TABLE|INDEX|DATABASE)/i,
        ],
        weight: 2,
    },
    json: {
        patterns: [
            /^\s*\{[\s\S]*"[^"]+"\s*:/,
            /^\s*\[/,
        ],
        weight: 1,
    },
    yaml: {
        patterns: [
            /^\w+:\s*$/m,
            /^\s+-\s+\w+/m,
        ],
        weight: 1,
    },
    ruby: {
        patterns: [
            /def\s+\w+/,
            /\bend$/m,
            /puts\s+/,
            /\.each\s+do/,
        ],
        weight: 2,
    },
    php: {
        patterns: [
            /<\?php/,
            /\$\w+\s*=/,
            /echo\s+/,
        ],
        weight: 2,
    },
    swift: {
        patterns: [
            /func\s+\w+\s*\(/,
            /var\s+\w+:\s*\w+/,
            /let\s+\w+:\s*\w+/,
            /import\s+(Foundation|UIKit|SwiftUI)/,
        ],
        weight: 2,
    },
    kotlin: {
        patterns: [
            /fun\s+\w+/,
            /val\s+\w+/,
            /var\s+\w+\s*:/,
        ],
        weight: 2,
    },
    shell: {
        patterns: [
            /^#!/,
            /\becho\s+/,
            /\$\([^)]+\)/,
            /fi$/m,
        ],
        weight: 2,
    },
    markdown: {
        patterns: [
            /^#{1,6}\s+\w+/m,
            /\*\*[^*]+\*\*/,
            /\[.*\]\(.*\)/,
            /```\w*/,
        ],
        weight: 1,
    },
    dockerfile: {
        patterns: [
            /^FROM\s+\w+/m,
            /^RUN\s+/m,
            /^CMD\s+/m,
            /^EXPOSE\s+\d+/m,
            /^WORKDIR\s+/m,
        ],
        weight: 2,
    },
    scala: {
        patterns: [
            /def\s+\w+\s*\[/,
            /val\s+\w+\s*:/,
            /object\s+\w+/,
            /case\s+class/,
            /trait\s+\w+/,
        ],
        weight: 2,
    },
    haskell: {
        patterns: [
            /::\s*\w+(\s*->\s*\w+)+/,
            /\w+\s*=\s*do\s*$/m,
            /import\s+qualified/,
            /module\s+\w+/,
            /where$/m,
        ],
        weight: 2,
    },
    dart: {
        patterns: [
            /void\s+main\s*\(\)/,
            /@override/,
            /Widget\s+build/,
            /import\s+['"]package:/,
            /class\s+\w+\s+extends\s+(State)?less?Widget/,
        ],
        weight: 2,
    },
    vue: {
        patterns: [
            /<template>/,
            /<script\s+setup/,
            /defineComponent/,
            /ref\s*\(/,
            /computed\s*\(/,
        ],
        weight: 3,
    },
    svelte: {
        patterns: [
            /<script\s+(lang="ts")?\s*>/,
            /\$:\s*\{/,
            /<style\s+lang=/,
            /export\s+let\s+\w+/,
            /on:\w+/,
        ],
        weight: 3,
    },
    lua: {
        patterns: [
            /function\s+\w+\s*\(/,
            /local\s+\w+\s*=/,
            /end$/m,
            /require\s*\(['"]/,
            /nil\b/,
        ],
        weight: 2,
    },
    r: {
        patterns: [
            /<-\s*/,
            /library\s*\(/,
            /function\s*\([^)]*\)\s*\{/,
            /data\.frame/,
            /ggplot\s*\(/,
        ],
        weight: 2,
    },
    perl: {
        patterns: [
            /^use\s+strict/m,
            /\$\w+\s*=/,
            /my\s+\$/,
            /sub\s+\w+\s*\{/,
            /=~\s*[sm]?\//,
        ],
        weight: 2,
    },
    elixir: {
        patterns: [
            /defmodule\s+\w+/,
            /def\s+\w+\s*do/,
            /\|>\s*\w+/,
            /@spec\s+\w+/,
            /fn\s+\w+\s*->/,
        ],
        weight: 2,
    },
    clojure: {
        patterns: [
            /\(defn?\s+\w+/,
            /\(ns\s+\w+/,
            /\(let\s+\[/,
            /\(if\s+/,
            /\(fn\s+\[/,
        ],
        weight: 2,
    },
};

export const SUPPORTED_LANGUAGES = [
    'plaintext', 'python', 'javascript', 'typescript', 'typescriptreact', 'javascriptreact',
    'java', 'cpp', 'c', 'csharp', 'rust', 'go', 'swift', 'kotlin',
    'html', 'css', 'scss', 'less', 'sql', 'json', 'yaml', 'xml', 'markdown',
    'ruby', 'php', 'perl', 'lua', 'r', 'shell', 'powershell', 'dockerfile',
    'scala', 'haskell', 'clojure', 'elixir', 'dart', 'groovy',
    'vue', 'svelte', 'graphql', 'toml', 'ini', 'makefile',
];

// Language display names
export const LANGUAGE_NAMES: Record<string, string> = {
    plaintext: 'Plain Text',
    typescriptreact: 'TSX',
    javascriptreact: 'JSX',
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    python: 'Python',
    cpp: 'C++',
    csharp: 'C#',
    dockerfile: 'Dockerfile',
    powershell: 'PowerShell',
    vue: 'Vue',
    svelte: 'Svelte',
    graphql: 'GraphQL',
    toml: 'TOML',
    makefile: 'Makefile',
    objectivec: 'Objective-C',
    scss: 'SCSS',
    less: 'LESS',
    ini: 'INI',
};

export function detectLanguage(code: string): string {
    const scores: Record<string, number> = {};

    for (const [lang, { patterns, weight }] of Object.entries(LANGUAGE_PATTERNS)) {
        let score = 0;
        for (const pattern of patterns) {
            // Create RegExp with 'gm' flags from the source pattern
            const regex = new RegExp(pattern.source, 'gm');
            const matches = code.match(regex);
            if (matches) {
                score += matches.length * weight;
            }
        }
        scores[lang] = score;
    }

    const detected = Object.entries(scores)
        .filter(([, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])[0];

    return detected ? detected[0] : 'plaintext';
}

export function getLanguageName(lang: string): string {
    return LANGUAGE_NAMES[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
}
