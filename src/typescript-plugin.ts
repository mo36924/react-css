import { doComplete as emmetDoComplete } from "@vscode/emmet-helper";
import ts, { server } from "typescript/lib/tsserverlibrary";
import { getCSSLanguageService, getSCSSLanguageService, TextDocument } from "vscode-css-languageservice";
import { CompletionItem, CompletionItemKind, CompletionList, TextEdit } from "vscode-languageserver-types";

const jsxCssAttributeNoSubstitutionTemplateLiteralPluginModuleFactory: server.PluginModuleFactory = (mod) => {
  const ts = mod.typescript;
  const ScriptElementKind = ts.ScriptElementKind;
  const wrapperPreRoot = ":root{";
  const wrapperPreRootLength = wrapperPreRoot.length;
  const emptyCompletionList: CompletionList = { items: [], isIncomplete: false };

  const getNode = (sourceFile: ts.SourceFile, position: number): ts.Node | undefined => {
    const find = (node: ts.Node): ts.Node | undefined => {
      if (position >= node.getStart() && position < node.getEnd()) {
        return ts.forEachChild(node, find) || node;
      }
    };

    return find(sourceFile);
  };

  const getElementKind = (kind?: CompletionItemKind): ts.ScriptElementKind => {
    switch (kind) {
      case CompletionItemKind.Method:
        return ScriptElementKind.memberFunctionElement;
      case CompletionItemKind.Function:
        return ScriptElementKind.functionElement;
      case CompletionItemKind.Constructor:
        return ScriptElementKind.constructorImplementationElement;
      case CompletionItemKind.Field:
      case CompletionItemKind.Variable:
        return ScriptElementKind.variableElement;
      case CompletionItemKind.Class:
        return ScriptElementKind.classElement;
      case CompletionItemKind.Interface:
        return ScriptElementKind.interfaceElement;
      case CompletionItemKind.Module:
        return ScriptElementKind.moduleElement;
      case CompletionItemKind.Property:
        return ScriptElementKind.memberVariableElement;
      case CompletionItemKind.Unit:
      case CompletionItemKind.Value:
        return ScriptElementKind.constElement;
      case CompletionItemKind.Enum:
        return ScriptElementKind.enumElement;
      case CompletionItemKind.Keyword:
        return ScriptElementKind.keyword;
      case CompletionItemKind.Color:
        return ScriptElementKind.constElement;
      case CompletionItemKind.Reference:
        return ScriptElementKind.alias;
      case CompletionItemKind.File:
        return ScriptElementKind.moduleElement;
      case CompletionItemKind.Snippet:
      case CompletionItemKind.Text:
      default:
        return ScriptElementKind.unknown;
    }
  };

  const getKindModifiers = (item: CompletionItem) => {
    if (item.kind === CompletionItemKind.Color) {
      return "color";
    }

    return "";
  };

  return {
    create(info) {
      const languageService = info.languageService;

      const getSourceFile = (fileName: string) => {
        const program = languageService.getProgram();

        if (!program) {
          throw new Error("language service host does not have program!");
        }

        const sourceFile = program.getSourceFile(fileName);

        if (!sourceFile) {
          throw new Error("No source file: " + fileName);
        }

        return sourceFile;
      };

      const cssLanguageService = getCSSLanguageService();
      const scssLanguageService = getSCSSLanguageService();

      const proxy: ts.LanguageService = Object.assign(
        Object.create(null),
        Object.fromEntries(Object.entries(languageService).map(([key, value]) => [key, value.bind(languageService)])),
      );

      proxy.getCompletionsAtPosition = (fileName, position, options, formattingSettings) => {
        const sourceFile = getSourceFile(fileName);
        const node = getNode(sourceFile, position);

        if (
          node &&
          ts.isNoSubstitutionTemplateLiteral(node) &&
          ts.isJsxExpression(node.parent) &&
          ts.isJsxAttribute(node.parent.parent) &&
          node.parent.parent.name.escapedText === "css" &&
          position > node.getStart()
        ) {
          const textDocument = TextDocument.create(
            "untitled://embedded.scss",
            "scss",
            1,
            `${wrapperPreRoot}${node.text}}`,
          );

          const stylesheet = scssLanguageService.parseStylesheet(textDocument);
          cssLanguageService.setCompletionParticipants([]);
          const start = node.getStart() + 1;
          const startPosition = ts.getLineAndCharacterOfPosition(sourceFile, start);
          const currentPosition = ts.getLineAndCharacterOfPosition(sourceFile, position);
          const line = currentPosition.line - startPosition.line;

          const character = line
            ? currentPosition.character
            : currentPosition.character - startPosition.character + wrapperPreRootLength;

          const textDocumentPosition = { line, character };
          const emmetResults = emmetDoComplete(textDocument, textDocumentPosition, "css", {}) || emptyCompletionList;
          const completionsCss = cssLanguageService.doComplete(textDocument, textDocumentPosition, stylesheet);
          const completionsScss = scssLanguageService.doComplete(textDocument, textDocumentPosition, stylesheet);

          completionsScss.items = completionsScss.items.filter(
            (item) => item.kind === CompletionItemKind.Function && item.label[0] === ":",
          );

          const completions: CompletionList = {
            isIncomplete: false,
            items: [...completionsCss.items, ...completionsScss.items],
          };

          if (emmetResults.items.length) {
            completions.items.push(...emmetResults.items);
            completions.isIncomplete = true;
          }

          const textEdit = completions.items[0]?.textEdit as TextEdit | undefined;

          const completionInfo: ts.WithMetadata<ts.CompletionInfo> = {
            metadata: {
              isIncomplete: completions.isIncomplete,
            },
            isGlobalCompletion: false,
            isMemberCompletion: false,
            isNewIdentifierLocation: false,
            optionalReplacementSpan: textEdit && {
              start: textDocument.offsetAt(textEdit.range.start) - wrapperPreRootLength + start,
              length: textDocument.offsetAt(textEdit.range.end) - textDocument.offsetAt(textEdit.range.start),
            },
            entries: completions.items.map((item) => ({
              name: item.label,
              kind: getElementKind(item.kind),
              kindModifiers: getKindModifiers(item),
              sortText: item.sortText || item.label,
            })),
          };

          return completionInfo;
        }

        return languageService.getCompletionsAtPosition(fileName, position, options, formattingSettings);
      };

      return proxy;
    },
  };
};

export default jsxCssAttributeNoSubstitutionTemplateLiteralPluginModuleFactory;
