import type { PluginObj, PluginPass } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import syntaxJsx from "@babel/plugin-syntax-jsx";
import { serialize, compile, stringify } from "stylis";
import hash from "@emotion/hash";

export type Options = {
  prefix?: string;
  minify?: boolean;
};

export default declare<Options, PluginObj<PluginPass & { id?: string }>>((api, options: Options) => {
  const t = api.types;
  const { prefix = "_", minify = process.env.NODE_ENV === "production" } = options;

  const compileStyle = (style: string): [className: string, css: string] => {
    const className = `${prefix}${hash(serialize(compile(`_{${style}}`), stringify))}`;
    const css = serialize(compile(`.${className}{${style}}`), stringify);
    return [className, css];
  };

  return {
    name: "@mo36924/react-css/babel-plugin",
    inherits: syntaxJsx,
    visitor: {
      Program: {
        exit(path, state) {
          const id = state.id;

          if (id == null) {
            return;
          }

          path.unshiftContainer("body", [
            t.importDeclaration(
              [t.importSpecifier(t.identifier(id), t.identifier("useCss"))],
              t.stringLiteral("@mo36924/react-css/css"),
            ),
          ]);
        },
      },
      JSXAttribute(path, state) {
        const { name, value } = path.node;

        if (name.name !== "css") {
          return;
        }

        const compile = (style: string) => {
          const [className, css] = compileStyle(style);
          const id = (state.id ??= path.scope.generateUid("useCss"));
          (state.styles ??= Object.create(null))[className] = css;
          const _path = path.find((path) => path.parentKey === "body")!;

          if (_path.isExpression()) {
            _path.replaceWith(
              t.sequenceExpression([t.callExpression(t.identifier(id), [t.stringLiteral(css)]), _path.node]),
            );
          } else {
            _path.insertBefore(t.expressionStatement(t.callExpression(t.identifier(id), [t.stringLiteral(css)])));
          }

          return className;
        };

        if (t.isStringLiteral(value)) {
          path.replaceWith(t.jsxAttribute(t.jsxIdentifier("className"), t.stringLiteral(compile(value.value))));
          return;
        }

        if (t.isJSXExpressionContainer(value)) {
          const expression = value.expression;

          if (t.isStringLiteral(expression)) {
            path.replaceWith(t.jsxAttribute(t.jsxIdentifier("className"), t.stringLiteral(compile(expression.value))));
            return;
          }

          if (t.isTemplateLiteral(expression)) {
            const { quasis, expressions } = expression;

            if (expressions.length) {
            } else {
              path.replaceWith(
                t.jsxAttribute(
                  t.jsxIdentifier("className"),
                  t.stringLiteral(compile(quasis[0].value.cooked ?? quasis[0].value.raw)),
                ),
              );

              return;
            }
          }
        }

        throw path.buildCodeFrameError("Invalid css prop value.");
      },
    },
  };
});
