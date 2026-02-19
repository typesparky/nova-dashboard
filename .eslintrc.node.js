module.exports = {
  env: {
    node: true,
    es2021: true,
    commonjs: true,
    mocha: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'no-undef': 'off',
    'no-unused-vars': 'off'
  }
};
