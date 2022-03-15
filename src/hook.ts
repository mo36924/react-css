import { Context } from "./context";
import { useContext } from "react";

export const useCss = (css: string) => {
  useContext(Context).add(css);
};
