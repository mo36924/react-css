import { transformSync } from "@babel/core";
import { describe, expect, test } from "@jest/globals";
import plugin from "./babel-plugin";

const transform = (code: string) =>
  transformSync(code, { babelrc: false, configFile: false, browserslistConfigFile: false, plugins: [plugin] })!.code!;

describe("babel-plugin", () => {
  test("top-level", () => {
    expect(transform(`<div css={\`color: red; padding: 1px;\`}></div>;`)).toMatchInlineSnapshot(`
      "import { useCss as _useCss } from \\"@mo36924/react-css/css\\";

      _useCss(\\"._1fq24nq{color:red;padding:1px;}\\");

      <div className=\\"_1fq24nq\\"></div>;"
    `);
  });

  test("arrow-function-expression", () => {
    expect(transform(`() => <div css={\`color: red; padding: 1px;\`}></div>;`)).toMatchInlineSnapshot(`
      "import { useCss as _useCss } from \\"@mo36924/react-css/css\\";

      () => (_useCss(\\"._1fq24nq{color:red;padding:1px;}\\"), <div className=\\"_1fq24nq\\"></div>);"
    `);
  });

  test("arrow-function-blockstatement", () => {
    expect(transform(`() => {const a = <div css={\`color: red; padding: 1px;\`}></div>;}`)).toMatchInlineSnapshot(`
      "import { useCss as _useCss } from \\"@mo36924/react-css/css\\";

      () => {
        _useCss(\\"._1fq24nq{color:red;padding:1px;}\\");

        const a = <div className=\\"_1fq24nq\\"></div>;
      };"
    `);
  });
});
