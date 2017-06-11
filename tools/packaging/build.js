const path = require('path');
const config = require('../../build-config');
const { writeFileSync } = require('fs');
const inlinePackageMetadataFiles = require('./metadata-inlining');
const addPureAnnotationsToFile = require('./pure-annotations');

const {packagesDir, outputDir, licenseBanner} = config;
const bundlesDir = path.join(outputDir, 'bundles');

/* Copy files function */ {
  const glob = require('glob');
  const fsExtra = require('fs-extra');

  function copyFiles(fromPath, fileGlob, outDir) {
    glob.sync(fileGlob, {cwd: fromPath}).forEach(filePath => {
      let fileDestPath = path.join(outDir, filePath);
      fsExtra.mkdirpSync(path.dirname(fileDestPath));
      fsExtra.copySync(path.join(fromPath, filePath), fileDestPath);
    });
  }
}

/**
 * Copies different output files into a folder structure that follows the `angular/angular`
 * release folder structure. The output will also contain a README and the according package.json
 * file. Additionally the package will be Closure Compiler and AOT compatible.
 */
module.exports = function composeRelease(packageName) {
  // To avoid refactoring of the project the package material will map to the source path `lib/`.
  const sourcePath = path.join(packagesDir, 'lib');
  const packagePath = path.join(outputDir, 'packages', packageName);
  const releasePath = path.join(outputDir, 'releases', packageName);

  inlinePackageMetadataFiles(packagePath);

  copyFiles(packagePath, '**/*.+(d.ts|metadata.json)', path.join(releasePath, 'typings'));
  copyFiles(bundlesDir, `${packageName}.umd?(.min).js?(.map)`, path.join(releasePath, 'bundles'));
  copyFiles(bundlesDir, `${packageName}?(.es5).js?(.map)`, path.join(releasePath, '@zuz'));
  copyFiles(packagesDir, 'README.md', releasePath);
  copyFiles(sourcePath, 'package.json', releasePath);

  createTypingsReexportFile(releasePath, packageName);
  createMetadataReexportFile(releasePath, packageName);
  addPureAnnotationsToFile(path.join(releasePath, '@zuz', `${packageName}.es5.js`));
};

function createTypingsReexportFile(outputDir, entryName) {
  writeFileSync(path.join(outputDir, `${entryName}.d.ts`),
    licenseBanner + '\nexport * from "./typings/index";'
  );
}


function createMetadataReexportFile(packageDir, packageName) {
  const metadataReExport =
    `{"__symbolic":"module","version":3,"metadata":{},"exports":[{"from":"./typings/index"}]}`;
  writeFileSync(path.join(packageDir, `${packageName}.metadata.json`), metadataReExport, 'utf-8');
}
