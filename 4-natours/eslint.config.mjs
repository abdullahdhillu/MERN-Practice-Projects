import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs", // Use CommonJS for Node.js
      globals: {
        ...globals.node, // Add Node.js globals (including `process`)
      },
    },
  },
  pluginJs.configs.recommended,
];
