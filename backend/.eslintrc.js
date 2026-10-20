module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ["eslint:recommended", "prettier"],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    "no-console": ["warn", { allow: ["error", "warn", "log"] }],
    "no-async-promise-executor": "error",
    "no-constructor-return": "error",
  },
};
