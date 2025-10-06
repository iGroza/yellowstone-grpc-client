// eslint.config.mjs  — Flat Config (ESM)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import eslintComments from 'eslint-plugin-eslint-comments';
import prettierPlugin from 'eslint-plugin-prettier';
import sortClassMembers from 'eslint-plugin-sort-class-members';

export default [
  js.configs.recommended,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'example/**',
      'scripts/**',
      '*.js',
      'src/web/**/*',
    ],
  },
  {
    ignores: ['src/web/**/*'],
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {project: './tsconfig.json'},
      globals: {
        NodeJS: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        Buffer: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        expect: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        fdescribe: 'readonly',
        xdescribe: 'readonly',
        fit: 'readonly',
        xit: 'readonly',
        test: 'readonly',
        xtest: 'readonly',
        setImmediate: 'readonly',
        clearTimeout: 'readonly',
        clearImmediate: 'readonly',
        globalThis: 'readonly',
        document: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        URLSearchParams: 'readonly',
        performance: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
      'eslint-comments': eslintComments,
      prettier: prettierPlugin,
      'sort-class-members': sortClassMembers,
    },
    rules: {
      /* === naming convention === */
      // camelCase - standard camelCase format - no underscores are allowed between characters, and consecutive capitals are allowed (i.e. both myID and myId are valid).
      // PascalCase - same as camelCase, except the first character must be upper-case.
      // snake_case - standard snake_case format - all characters must be lower-case, and underscores are allowed.
      // strictCamelCase - same as camelCase, but consecutive capitals are not allowed (i.e. myId is valid, but myID is not).
      // StrictPascalCase - same as strictCamelCase, except the first character must be upper-case.
      // UPPER_CASE - same as snake_case, except all characters must be upper-case.
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase', 'snake_case'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {selector: 'typeLike', format: ['PascalCase', 'snake_case']},
        {
          selector: ['variable', 'function', 'import'],
          format: ['camelCase', 'PascalCase', 'UPPER_CASE', 'snake_case'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {selector: 'parameter', format: ['camelCase', 'snake_case']},
        {selector: 'enumMember', format: ['UPPER_CASE']},
        {
          selector: [
            'property',
            'typeProperty',
            'objectLiteralProperty',
            'parameterProperty',
          ],
          format: null,
        },
      ],

      'no-unused-vars': 'warn',

      /* === class member ordering === */
      '@typescript-eslint/member-ordering': 'off',

      'sort-class-members/sort-class-members': [
        'error',
        {
          order: [
            {static: true, type: 'property', sort: 'alphabetical'},
            {type: 'property', sort: 'alphabetical'},
            'constructor',
            {static: true, type: 'method', sort: 'alphabetical'},
            {type: 'method', sort: 'alphabetical'},
          ],
          groups: {
            'event-handlers': [{name: '/on.+/', type: 'method'}],
            broadcast: [{name: '/broadcast.+/', type: 'method'}],
            simulate: [{name: '/simulate.+/', type: 'method'}],
          },
          accessorPairPositioning: 'getThenSet',
          stopAfterFirstProblem: false,
          locale: 'en-US',
        },
      ],

      'eslint-comments/disable-enable-pair': ['error', {allowWholeFile: true}],
      'eslint-comments/no-unused-disable': 'error',

      'import/order': [
        'error',
        {'newlines-between': 'always', alphabetize: {order: 'asc'}},
      ],
      'sort-imports': [
        'error',
        {ignoreDeclarationSort: true, ignoreCase: true},
      ],

      'prettier/prettier': 'error',
    },
  },
];
