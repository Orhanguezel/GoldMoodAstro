module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: ['android/**', 'dist/**', '.expo/**', 'node_modules/**'],
  rules: {
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-wrapper-object-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
