/* eslint-env node */
module.exports = {
    env: {
        es2023: true,
        jest: true,
        node: true,
    },
    extends: ['eslint:recommended'],
    root: true,
    rules: {
        'no-unused-vars': [
            'error',
            {
                varsIgnorePattern: '^_',
                argsIgnorePattern: '^_',
            },
        ],
    },
};
