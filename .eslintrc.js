module.exports = {
  'env': {
    'es6': true,
    'mocha': true,
    'node': true
  },
  'extends': 'eslint:recommended',
  'parserOptions': {
    'sourceType': 'module',
    'ecmaVersion': 2017
  },
  'rules': {
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'linebreak-style': ['error', 'unix'],
    'no-console': 'off',
    'no-control-regex': 'off',
    'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
    'semi': ['error', 'never']
  }
}
