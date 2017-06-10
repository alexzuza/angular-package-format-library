const path = require('path');
const config = require('../../build-config');

/*
import {addPureAnnotationsToFile} from './pure-annotations';
import {updatePackageVersion} from './package-versions';
import {inlinePackageMetadataFiles} from './metadata-inlining';
import {createTypingsReexportFile} from './typings-reexport';
import {createMetadataReexportFile} from './metadata-reexport';*/



const {packagesDir, outputDir, projectDir} = config;
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

  //inlinePackageMetadataFiles(packagePath);

  copyFiles(packagePath, '**/*.+(d.ts|metadata.json)', join(releasePath, 'typings'));
  copyFiles(bundlesDir, `${packageName}.umd?(.min).js?(.map)`, join(releasePath, 'bundles'));
  copyFiles(bundlesDir, `${packageName}?(.es5).js?(.map)`, join(releasePath, '@angular'));
  copyFiles(projectDir, 'LICENSE', releasePath);
  copyFiles(packagesDir, 'README.md', releasePath);
  copyFiles(sourcePath, 'package.json', releasePath);

/*  updatePackageVersion(releasePath);
  createTypingsReexportFile(releasePath, packageName);
  createMetadataReexportFile(releasePath, packageName);
  addPureAnnotationsToFile(path.join(releasePath, '@angular', `${packageName}.es5.js`));*/
};
