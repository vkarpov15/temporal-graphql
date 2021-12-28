'use strict';

const ts = require('typescript');

module.exports = function parseFile(fileName) {
  const program = ts.createProgram([fileName], {});

  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(fileName);

  const exportedSymbols = checker.getExportsOfModule(checker.getSymbolAtLocation(sourceFile));

  const typeDefMutations = [];
  for (const symbol of exportedSymbols) {
    const fnName = symbol.getName();
    const exportedSymbolFlags = symbol.getFlags();

    if (exportedSymbolFlags !== ts.SymbolFlags.Function) {
      // ignore anything that isn't a function
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

    typeDefMutations.push(...calls);
  }

  return typeDefMutations;
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