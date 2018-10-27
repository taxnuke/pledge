module.exports = {
  'env': {
    'es6': true,
    'node': true,
    'jest': true
  },
  'extends': 'eslint:recommended',
  'parserOptions': {
    'ecmaVersion': 2015
  },
  'rules': {
    'indent': [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'never'
    ],
    'arrow-parens': [
      'error',
      'as-needed'
    ],
    'no-multiple-empty-lines': [
      'error',
      {
        'max': 1
      }
    ]
  }
}
