<<<<<<< HEAD
<<<<<<< HEAD
// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

=======
>>>>>>> f46aed39bb4f6e27a70aca0d026937b7c67c8ce6
=======
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

<<<<<<< HEAD
<<<<<<< HEAD
const eslintConfig = [...compat.extends("next/core-web-vitals", "next/typescript"), {
  rules: {
    // TypeScript 相关规则
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "off",
    
    // React 相关规则
    "react-hooks/exhaustive-deps": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    
    // Next.js 相关规则
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",
    
    // 一般JavaScript规则
    "prefer-const": "off",  // 关闭prefer-const规则
    "no-unused-vars": "off",
    "no-console": "off",
    "no-debugger": "off",
    "no-empty": "off",
    "no-irregular-whitespace": "off",
    "no-case-declarations": "off",
    "no-fallthrough": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-redeclare": "off",
    "no-undef": "off",
    "no-unreachable": "off",
    "no-useless-escape": "off",
  },
}, ...storybook.configs["flat/recommended"]];
=======
const eslintConfig = [
=======
const eslintConfig = [
<<<<<<< HEAD
  {
    ignores: ["kaldr1/**", "node_modules/**", ".next/**", "dist/**", "*.log"]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // TypeScript related rules
=======
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // TypeScript 相关规则
<<<<<<< HEAD
=======
>>>>>>> 825fb317ac2b476898191ee36891ce92b0ff27ca
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/prefer-as-const": "off",
      
<<<<<<< HEAD
      // React 相关规则
=======
<<<<<<< HEAD
      // React related rules
=======
      // React 相关规则
>>>>>>> 825fb317ac2b476898191ee36891ce92b0ff27ca
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
      "react-hooks/exhaustive-deps": "off",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "react/prop-types": "off",
      
<<<<<<< HEAD
=======
<<<<<<< HEAD
      // Next.js related rules
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      
      // General JavaScript rules
      "prefer-const": "off",  // Turn off prefer-const rule
=======
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
      // Next.js 相关规则
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      
      // 一般JavaScript规则
      "prefer-const": "off",  // 关闭prefer-const规则
<<<<<<< HEAD
=======
>>>>>>> 825fb317ac2b476898191ee36891ce92b0ff27ca
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
      "no-unused-vars": "off",
      "no-console": "off",
      "no-debugger": "off",
      "no-empty": "off",
      "no-irregular-whitespace": "off",
      "no-case-declarations": "off",
      "no-fallthrough": "off",
      "no-mixed-spaces-and-tabs": "off",
      "no-redeclare": "off",
      "no-undef": "off",
      "no-unreachable": "off",
      "no-useless-escape": "off",
    },
  },
];
<<<<<<< HEAD
>>>>>>> f46aed39bb4f6e27a70aca0d026937b7c67c8ce6
=======
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb

export default eslintConfig;
