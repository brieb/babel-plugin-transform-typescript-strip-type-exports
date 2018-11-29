import * as BabelCore from "@babel/core";
import { NodePath } from "@babel/traverse";
import { createSet } from "./createSet";

export default function(babel: typeof BabelCore): BabelCore.PluginObj {
  return {
    visitor: {
      Program(path) {
        const { tsVisitor, exportsVisitor } = createVisitors(babel);
        path.traverse(tsVisitor);
        path.traverse(exportsVisitor);
      }
    }
  };
}

function createVisitors(babel: typeof BabelCore) {
  const { types: t } = babel;

  const typeNameSet = createSet();
  const enumNameSet = createSet();
  const tsVisitor: BabelCore.Visitor = {
    TSInterfaceDeclaration(path) {
      typeNameSet.add(path.node.id.name);
    },
    TSTypeAliasDeclaration(path) {
      typeNameSet.add(path.node.id.name);
    },
    TSEnumDeclaration(path) {
      enumNameSet.add(path.node.id.name);
    }
  };

  function isTypeWithoutValue(name: string, path: NodePath): boolean {
    if (!typeNameSet.has(name)) {
      return false;
    }
    const hasValue = enumNameSet.has(name) || path.scope.hasBinding(name);
    return !hasValue;
  }

  const exportsVisitor: BabelCore.Visitor = {
    ExportNamedDeclaration(path) {
      if (path.node.source) {
        // Only process local exports.
        return;
      }

      const filteredSpecifiers = path.node.specifiers.filter(specifier => {
        if (t.isExportSpecifier(specifier)) {
          return !isTypeWithoutValue(specifier.local.name, path);
        }
        return true;
      });

      if (path.node.specifiers.length !== filteredSpecifiers.length) {
        if (filteredSpecifiers.length === 0) {
          path.remove();
        } else {
          const clone = t.clone(path.node);
          clone.specifiers = filteredSpecifiers;
          path.replaceWith(clone);
        }
      }
    },
    ExportDefaultDeclaration(path) {
      const declaration = path.node.declaration;
      if (t.isIdentifier(declaration) && isTypeWithoutValue(declaration.name, path)) {
        path.remove();
      }
    }
  };

  return { tsVisitor, exportsVisitor };
}
