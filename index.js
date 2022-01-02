'use strict';

const ts = require('typescript');

module.exports = function parseFile(fileName) {
  const program = ts.createProgram([fileName], {});

  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(fileName);

  const exportedSymbols = checker.getExportsOfModule(checker.getSymbolAtLocation(sourceFile));

  const mutations = [];
  const queries = [];
  for (const symbol of exportedSymbols) {
    const fnName = symbol.getName();
    const exportedSymbolFlags = symbol.getFlags();

    if (exportedSymbolFlags !== ts.SymbolFlags.Function) {
      const initializer = symbol.valueDeclaration.initializer.getText();
      
      const signalMatch = initializer.match(/defineSignal(<.*>)?\('(.*)'\)$/);
      if (signalMatch) {
        let typeArgs = [];
        if (symbol.valueDeclaration.initializer.typeArguments) {
          typeArgs = symbol.valueDeclaration.initializer.typeArguments[0].elements.map(el => el.getText());
        }
        const signalName = signalMatch[2];
        mutations.push(`${signalName}(${typeArgs.map((t, i) => `arg${i}: ${getTypeForString(t)}`).join(', ')}): ID`);
      }

      const queryMatch = initializer.match(/defineQuery(<.*>)?\('(.*)'\)$/);

      if (queryMatch) {
        const typeArgs = (symbol.valueDeclaration.initializer.typeArguments || []).map(arg => arg.getText());
        const queryName = queryMatch[2];
        mutations.push(`${queryName}(): ${getTypeForString(typeArgs[0])}`);
      }

      continue;
    }

    const functionType = checker.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration
    );
    const calls = functionType.getCallSignatures().map(signature => {
      let returnType = signature.declaration.type.getText();
      if (/^Promise<.*>$/.test(returnType)) {
        returnType = returnType.replace(/^Promise</, '').replace(/>$/, '');
      }

      const parameters = signature.parameters.map(parameterDeclaration => {
        const name = parameterDeclaration.valueDeclaration.name.getText();
        const type = parameterDeclaration.valueDeclaration.type.getText();
        return `${name}: ${getTypeForString(type)}`;
      });

      return `${fnName}(${parameters.join(', ')}): ${getTypeForString(returnType)}`;
    });

    mutations.push(...calls);
  }

  return { queries, mutations };
}

function getTypeForString(str) {
  switch(str) {
    case 'string':
      return 'String';
    case 'number':
      return 'Float';
    case 'boolean':
      return 'Boolean';
    case 'void':
      // GraphQL doesn't allow void type, so just hard code id
      return 'ID';
    default:
      throw new Error(`Unknown type name "${str}"`);  
  }
}