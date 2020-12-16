module.exports = {
    env: {
        'jest/globals': true,
        browser: true,
    },
    root: true,
    extends: ['@react-native-community', 'prettier', 'prettier/react'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'jest', 'import'],
    rules: {
        'react-native/no-inline-styles': 0,
        'prettier/prettier': 0,
        'import/order': [
            'error',
            {
                groups: ['builtin', 'external', 'internal', ['index', 'sibling', 'parent']],
                'newlines-between': 'always',
                pathGroupsExcludedImportTypes: ['builtin'],
                alphabetize: { order: 'asc', caseInsensitive: true },
            },
        ],
    },
};
