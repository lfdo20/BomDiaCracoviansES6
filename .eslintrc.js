module.exports = {
  "extends": "airbnb-base",
  "plugins": [
    "react"
  ],
  "rules": {
    "no-unused-vars": "off",
    "one-var": "off",
    "no-use-before-define": "off",
    "comma-dangle": "off",
    "no-console": "off",
    "no-confusing-arrow": "off",
    "object-curly-newline": "off",
    "one-var-declaration-per-line": "off",
    "prefer-destructuring": "off",
    "react/jsx-uses-react": "error",
    "react/jsx-uses-vars": "error",
    "no-unused-expressions": "off",
    "camelcase": "off",
    "arrow-body-style": "off"
  },
  "env": {
    "node": true
  },
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    }
  }
};
