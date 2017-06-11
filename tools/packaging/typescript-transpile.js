const ts = require('typescript');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

/** Reads a input file and transpiles it into a new file. */
module.exports = function transpileFile(inputPath, outputPath, options) {
  const inputFile = fs.readFileSync(inputPath, 'utf-8');
  const transpiled = ts.transpileModule(inputFile, { compilerOptions: options });

  reportDiagnostics(transpiled.diagnostics);

  fs.writeFileSync(outputPath, transpiled.outputText);

  if (transpiled.sourceMapText) {
    fs.writeFileSync(`${outputPath}.map`, transpiled.sourceMapText);
  }
}

/** Formats the TypeScript diagnostics into a error string. */
function formatDiagnostics(diagnostics, baseDir) {
  return diagnostics.map(diagnostic => {
    let res = `• ${chalk.red(`TS${diagnostic.code}`)} - `;

    if (diagnostic.file) {
      const {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      const filePath = path.relative(baseDir, diagnostic.file.fileName);

      res += `${filePath}(${line + 1},${character + 1}): `;
    }
    res += `${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`;

    return res;
  }).join('\n');
}

/** Checks and reports diagnostics if present. */
function reportDiagnostics(diagnostics, baseDir) {
  if (diagnostics && diagnostics.length && diagnostics[0]) {
    console.error(formatDiagnostics(diagnostics, baseDir));
    throw new Error('TypeScript compilation failed.');
  }
}
