module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
    // '@vue/typescript',
  ],
  rules: {
    'no-console': 'off',
    'no-debugger': process.env.NODE_ENV === 'prod' ? 'error' : 'off',
    'max-len': [2, 200],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.test.{js,ts,jsx,tsx}',
          '**/*.spec.{js,ts,jsx,tsx}',
          'vitest.config.{js,ts}',
          'vite.config.{js,ts}',
          '**/tests/**',
          '**/__tests__/**'],
      },
    ],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        ts: 'never',
        vue: 'never',
        json: 'always',
        css: 'never', // 👈 ADD THIS
      },
    ],
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  ignorePatterns: ['dist/', 'service-worker.js'],
  settings: {
    'import/resolver': {
      alias: {
        map: [['@', './src']],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
      },
    },
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
