import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        ignores: ['dist/**']
    },
    {
        files: ['**/*.{js,mjs,cjs}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.jest,
                ...globals.node,
            }
        },
        rules: {
            indent: ['error', 4],
            "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
        }
    }
];
