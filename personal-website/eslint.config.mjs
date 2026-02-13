import nextConfig from "eslint-config-next";
import prettier from "eslint-config-prettier";

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  prettier,
];

export default eslintConfig;
