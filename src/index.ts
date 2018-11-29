import * as BabelCore from "@babel/core";
import { NodePath } from "@babel/traverse";

export default function(babel: typeof BabelCore): BabelCore.PluginObj {
  const { types: t } = babel;

  const typeNames: { [name: string]: true | undefined } = {};
  const typesVisitor: BabelCore.Visitor = {
    TSInterfaceDeclaration(path) {
      typeNames[path.node.id.name] = true;
    },
    TSTypeAliasDeclaration(path) {
      typeNames[path.node.id.name] = true;
    }
  };

  function isTypeWithoutBinding(name: string, path: NodePath): boolean {
    return !!typeNames[name] && !path.scope.hasBinding(name);
  }

  const exportsVisitor: BabelCore.Visitor = {
    ExportNamedDeclaration(path) {
      if (path.node.source) {
        // Only process local exports.
        return;
      }

      const filteredSpecifiers = path.node.specifiers.filter(specifier => {
        if (t.isExportSpecifier(specifier)) {
          return !isTypeWithoutBinding(specifier.local.name, path);
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
      if (t.isIdentifier(declaration) && isTypeWithoutBinding(declaration.name, path)) {
        path.remove();
      }
    },
    ExportSpecifier(path) {
      const binding = path.scope.getBinding(path.node.local.name);
      if (binding) {
        let hasValueBinding = false;
        const bindingPaths = [binding.path, ...binding.referencePaths];
        for (const bindingPath of bindingPaths) {
          if (bindingPath.parent !== path.node) {
            if (!t.isTSInterfaceDeclaration(bindingPath.parent)) {
              hasValueBinding = true;
            }
          }
        }
        if (!hasValueBinding) {
          path.remove();
        }
      }
    }
  };

  return {
    visitor: {
      Program(path) {
        path.traverse(typesVisitor);
        path.traverse(exportsVisitor);
      }
    }
  };
}
