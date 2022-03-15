import { createContext } from "react";

export const Context = createContext(new Set<string>());
export const { Provider, Consumer } = Context;
