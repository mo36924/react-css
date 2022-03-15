import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import nodeResolve from "@rollup/plugin-node-resolve";

export default defineConfig([
  {
    input: ["src/babel-plugin.ts", "src/index.ts", "src/jsx-dev-runtime.ts", "src/jsx-runtime.ts"],
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
    plugins: [typescript()],
  },
  {
    input: ["src/babel-plugin.ts", "src/index.ts", "src/jsx-dev-runtime.ts", "src/jsx-runtime.ts"],
    output: [
      {
        dir: "dist",
        format: "module",
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].js",
      },
    ],
    external: /^[@\w]/,
    plugins: [typescript(), nodeResolve({ extensions: [".client.ts", ".ts"] })],
  },
  {
    input: {
      "babel-plugin.ts": "src/babel-plugin.ts",
      index: "src/index.ts",
      "jsx-runtime": "src/jsx-runtime.ts",
      "jsx-dev-runtime": "src/jsx-dev-runtime.ts",
    },
    output: {
      dir: "dist",
    },
    external: /^[@\w]/,
    plugins: [dts()],
  },
]);
