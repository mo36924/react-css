import type {} from "react";

type JSXIntrinsicElements = {
  [K in keyof globalThis.JSX.IntrinsicElements]: globalThis.JSX.IntrinsicElements[K] & {
    css?: string;
  };
};

declare namespace JSX {
  interface IntrinsicElements extends JSXIntrinsicElements {}
}

export type { JSX };
