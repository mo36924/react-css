import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { parse } from "path";
import { defineConfig } from "rollup";
import dts from "rollup-plugin-dts";

const input = [
  "src/babel-plugin.ts",
  "src/index.ts",
  "src/jsx-dev-runtime.ts",
  "src/jsx-runtime.ts",
  "src/typescript-plugin.ts",
];

const typescriptPlugin = typescript();

export default defineConfig([
  {
    input,
    output: [
      {
        dir: "dist",
        format: "module",
        entryFileNames: "[name].mjs",
        chunkFileNames: "[name]-[hash].mjs",
      },
      {
        dir: "dist",
        format: "commonjs",
        entryFileNames: "[name].cjs",
        chunkFileNames: "[name]-[hash].cjs",
        exports: "auto",
      },
    ],
    external: /^[@\w]/,
    plugins: [typescriptPlugin],
  },
  {
    input,
    output: [
      {
        dir: "dist",
        format: "module",
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].js",
      },
    ],
    external: /^[@\w]/,
    plugins: [typescriptPlugin, nodeResolve({ extensions: [".client.ts", ".ts"] })],
  },
  {
    input: Object.fromEntries(input.map((path) => [parse(path).name, path])),
    output: {
      dir: "dist",
    },
    external: /^[@\w]/,
    plugins: [dts()],
  },
]);
