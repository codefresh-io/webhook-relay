module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module'
    },
    plugins: [
        '@typescript-eslint/eslint-plugin',
        'unused-imports',
        'unicorn'
    ],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript'
    ],
    root: true,
    env: {
        node: true,
        jest: true
    },
    ignorePatterns: ['.eslintrc.js', '*.d.ts'],
    rules: {
        'no-process-env': 'error',
        'unicorn/better-regex': 'error',
        'unicorn/consistent-function-scoping': 'error',
        'unicorn/custom-error-definition': 'off',
        'unicorn/empty-brace-spaces': 'error',
        'unicorn/error-message': 'error',
        'unicorn/escape-case': 'error',
        'unicorn/expiring-todo-comments': 'error',
        'unicorn/explicit-length-check': 'error',
        'unicorn/import-index': 'off',
        'unicorn/new-for-builtins': 'error',
        'unicorn/no-array-push-push': 'error',
        'unicorn/no-array-reduce': ['error', { 'allowSimpleOperations': true }],
        'unicorn/no-console-spaces': 'error',
        'unicorn/no-hex-escape': 'error',
        'unicorn/no-instanceof-array': 'error',
        'unicorn/no-keyword-prefix': 'off',
        'unicorn/no-lonely-if': 'error',
        'no-nested-ternary': 'off',
        'unicorn/no-nested-ternary': 'error',
        'unicorn/no-new-array': 'error',
        'unicorn/no-new-buffer': 'error',
        'unicorn/no-object-as-default-parameter': 'error',
        'unicorn/no-process-exit': 'off',
        'unicorn/no-this-assignment': 'error',
        'unicorn/no-unreadable-array-destructuring': 'error',
        'unicorn/no-unsafe-regex': 'off',
        'unicorn/no-unused-properties': 'off',
        'unicorn/no-useless-undefined': 'error',
        'unicorn/no-zero-fractions': 'error',
        'unicorn/number-literal-case': 'error',
        'unicorn/numeric-separators-style': 'off',
        'unicorn/prefer-add-event-listener': 'error',
        'unicorn/prefer-array-find': 'error',
        'unicorn/prefer-array-flat-map': 'error',
        'unicorn/prefer-array-index-of': 'error',
        'unicorn/prefer-array-some': 'error',
        'unicorn/prefer-date-now': 'error',
        'unicorn/prefer-default-parameters': 'error',
        'unicorn/prefer-dom-node-append': 'error',
        'unicorn/prefer-dom-node-dataset': 'error',
        'unicorn/prefer-dom-node-remove': 'error',
        'unicorn/prefer-dom-node-text-content': 'error',
        'unicorn/prefer-includes': 'error',
        'unicorn/prefer-keyboard-event-key': 'error',
        'unicorn/prefer-math-trunc': 'error',
        'unicorn/prefer-modern-dom-apis': 'error',
        'unicorn/prefer-negative-index': 'error',
        'unicorn/prefer-number-properties': 'error',
        'unicorn/prefer-optional-catch-binding': 'error',
        'unicorn/prefer-query-selector': 'error',
        'unicorn/prefer-reflect-apply': 'error',
        'unicorn/prefer-regexp-test': 'error',
        'unicorn/prefer-set-has': 'error',
        'unicorn/prefer-spread': 'error',
        'unicorn/prefer-string-replace-all': 'off',
        'unicorn/prefer-string-slice': 'error',
        'unicorn/prefer-string-starts-ends-with': 'error',
        'unicorn/prefer-string-trim-start-end': 'error',
        'unicorn/prefer-ternary': 'off',
        'unicorn/prefer-type-error': 'error',
        'unicorn/string-content': 'off',
        'unicorn/throw-new-error': 'error',
        '@typescript-eslint/no-namespace': 'off',
        'unicorn/filename-case': [
            'error',
            {
                'case': 'kebabCase'
            }
        ],
        'import/order': ['error', {
            'newlines-between': 'always',
            'groups': [
                'external',
                'internal'
            ]
        }],
        'unused-imports/no-unused-imports': 'error',
        '@typescript-eslint/naming-convention': [
            'error',
            {
                'selector': 'default',
                'format': ['camelCase'],
                'leadingUnderscore': 'allow'
            },
            {
                'selector': 'variable',
                'format': ['camelCase', 'UPPER_CASE', 'PascalCase']
            },
            {
                'selector': 'enumMember',
                'format': ['camelCase', 'UPPER_CASE']
            },
            {
                'selector': 'parameter',
                'format': ['camelCase'],
                'leadingUnderscore': 'allow'
            },
            {
                'selector': 'memberLike',
                'modifiers': ['private'],
                'format': ['camelCase'],
                'leadingUnderscore': 'allow'
            },
            {
                'selector': 'typeLike',
                'format': ['PascalCase']
            }
        ],
        'max-lines': ['error', 400],
        '@typescript-eslint/quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
        'array-bracket-spacing': ['error', 'always'],
        'comma-dangle': ['error', 'always-multiline'],
        'comma-spacing': ['error', { 'before': false, 'after': true }],
        'key-spacing': ['error', { 'afterColon': true }],
        'object-curly-spacing': ['error', 'always'],
        '@typescript-eslint/keyword-spacing': ['error'],
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/type-annotation-spacing': 'error',
        '@typescript-eslint/semi': ['error', 'never'],
        '@typescript-eslint/member-ordering': 'error',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-unnecessary-condition': ['error']
    },
    overrides: [
        {
            files: ['*.decorator.ts'],
            rules: {
                'camelcase': 'off',
                '@typescript-eslint/naming-convention': [
                    'error',
                    {
                        'selector': 'default',
                        'format': ['camelCase']
                    },
                    {
                        'selector': 'variable',
                        'format': ['PascalCase', 'camelCase', 'UPPER_CASE']
                    },
                    {
                        'selector': 'parameter',
                        'format': ['camelCase'],
                        'leadingUnderscore': 'allow'
                    },
                    {
                        'selector': 'memberLike',
                        'modifiers': ['private'],
                        'format': ['camelCase'],
                        'leadingUnderscore': 'allow'
                    },
                    {
                        'selector': 'typeLike',
                        'format': ['PascalCase']
                    }
                ]
            }
        },
        {
            files: ['config.*', 'index.ts'],
            rules: {
                'no-process-env': 'off'
            }
        }
    ]
};
