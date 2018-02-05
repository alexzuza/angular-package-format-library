const { join, dirname } = require('path');
const config = require('../../build-config');
const { writeFileSync, appendFileSync, readFileSync } = require('fs');
const { sync } = require('glob');
const { mkdirpSync, copySync } = require('fs-extra');
const { platform } = require('os');
const { spawnSync } = require('child_process');
const inlinePackageMetadataFiles = require('../metadata-inlining');

const { packagesDir, outputDir, licenseBanner } = config;
const bundlesDir = join(outputDir, 'bundles');

function copyFiles(fromPath, fileGlob, outDir) {
  sync(fileGlob, {cwd: fromPath}).forEach(filePath => {
    const fileDestPath = join(outDir, filePath);
    mkdirpSync(dirname(fileDestPath));
    copySync(join(fromPath, filePath), fileDestPath);
  });
}


/**
 * Copies different output files into a folder structure that follows the `angular/angular`
 * release folder structure. The output will also contain a README and the according package.json
 * file. Additionally the package will be Closure Compiler and AOT compatible.
 */
module.exports = function composeRelease(pkg) {
  const name = pkg.name;

  // To avoid refactoring of the project the package material will map to the source path `lib/`.
  const sourcePath = join(packagesDir, 'lib');
  const packagePath = join(outputDir, 'packages', name);
  const releasePath = join(outputDir, 'releases', name);
  const importAsName = `@zuz/${name}`;

  inlinePackageMetadataFiles(packagePath);

  // Copy all d.ts and metadata files to the `typings/` directory
  copyFiles(packagePath, '**/*.+(d.ts|metadata.json)', join(releasePath, 'typings'));

  // Copy UMD bundles.
  copyFiles(bundlesDir, `${name}.umd?(.min).js?(.map)`, join(releasePath, 'bundles'));

  // Copy ES5 bundles.
  copyFiles(bundlesDir, `${name}.es5.js?(.map)`, join(releasePath, 'esm5'));
  copyFiles(join(bundlesDir, name), `*.es5.js?(.map)`, join(releasePath, 'esm5'));

  // Copy ES2015 bundles
  copyFiles(bundlesDir, `${name}.js?(.map)`, join(releasePath, 'esm2015'));
  debugger
  copyFiles(join(bundlesDir, name), `!(*.es5|*.umd).js?(.map)`, join(releasePath, 'esm2015'));

  copyFiles(packagesDir, 'README.md', releasePath);
  copyFiles(sourcePath, 'package.json', releasePath);

  replaceVersionPlaceholders(releasePath);
  createTypingsReexportFile(releasePath, './typings/index', name);
  createMetadataReexportFile(releasePath, './typings/index', name, importAsName);

  if (pkg.secondaryEntryPoints.length) {
    createFilesForSecondaryEntryPoint(pkg, releasePath);
  }

  if (pkg.exportsSecondaryEntryPointsAtRoot) {
    // Add re-exports to the root d.ts file to prevent errors of the form
    // "@angular/material/material has no exported member 'MATERIAL_SANITY_CHECKS."

    const es2015Exports = pkg.secondaryEntryPoints
      .map(p => `export * from './${p}';`).join('\n');
    appendFileSync(join(releasePath, `${name}.d.ts`), es2015Exports, 'utf-8');

    // When re-exporting secondary entry-points, we need to manually create a metadata file that
    // re-exports everything.
    createMetadataReexportFile(
      releasePath,
      pkg.secondaryEntryPoints.concat(['typings/index']).map(p => `./${p}`),
      name,
      importAsName);
  }
};


function createTypingsReexportFile(outDir, from, fileName) {
  writeFileSync(join(outDir, `${fileName}.d.ts`),
    `${licenseBanner}\nexport * from '${from}';\n`,
    'utf-8');
}

function createMetadataReexportFile(destDir, from, entryPointName, importAsName) {
  from = Array.isArray(from) ? from : [from];

  const metadataJsonContent = JSON.stringify({
    __symbolic: 'module',
    version: 4,
    metadata: {},
    exports: from.map(f => ({from: f})),
    flatModuleIndexRedirect: true,
    importAs: importAsName
  }, null, 2);

  writeFileSync(join(destDir, `${entryPointName}.metadata.json`), metadataJsonContent, 'utf-8');
}


/** Creates files necessary for a secondary entry-point. */
function createFilesForSecondaryEntryPoint(buildPackage, releasePath) {
  const {name} = buildPackage;
  const packageOut = buildPackage.outputDir;

  buildPackage.secondaryEntryPoints.forEach(entryPointName => {
    // Create a directory in the root of the package for this entry point that contains
    // * A package.json that lists the different bundle locations
    // * An index.d.ts file that re-exports the index.d.ts from the typings/ directory
    // * A metadata.json re-export for this entry-point's metadata.
    const entryPointDir = join(releasePath, entryPointName);
    const importAsName = `@zuz/${name}/${entryPointName}`;

    mkdirpSync(entryPointDir);
    createEntryPointPackageJson(entryPointDir, name, entryPointName);

    // Copy typings and metadata from tsc output location into the entry-point.
    copyFiles(
      join(packageOut, entryPointName),
      '**/*.+(d.ts|metadata.json)',
      join(entryPointDir, 'typings'));

    // Create a typings and a metadata re-export within the entry-point to point to the
    // typings we just copied.
    createTypingsReexportFile(entryPointDir, `./typings/index`, 'index');
    createMetadataReexportFile(entryPointDir, `./typings/index`, 'index', importAsName);

    // Finally, create both a d.ts and metadata file for this entry-point in the root of
    // the package that re-exports from the entry-point's directory.
    createTypingsReexportFile(releasePath, `./${entryPointName}/index`, entryPointName);
    createMetadataReexportFile(releasePath, `./${entryPointName}/index`, entryPointName,
      importAsName);
  });
}




/** Variable that is set to the string for version placeholders. */
const versionPlaceholderText = '0.0.0-PLACEHOLDER';

/** Placeholder that will be replaced with the required Angular version. */
const ngVersionPlaceholderText = '0.0.0-NG';

/** RegExp that matches version placeholders inside of a file. */
const ngVersionPlaceholderRegex = new RegExp(ngVersionPlaceholderText, 'g');

/** Expression that matches Angular version placeholders within a file. */
const versionPlaceholderRegex = new RegExp(versionPlaceholderText, 'g');

function replaceVersionPlaceholders(packageDir) {
  // Resolve files that contain version placeholders using Grep or Findstr since those are
  // extremely fast and also have a very simple usage.
  const files = findFilesWithPlaceholders(packageDir);

  // Walk through every file that contains version placeholders and replace those with the current
  // version of the root package.json file.
  files.forEach(filePath => {
    const fileContent = readFileSync(filePath, 'utf-8')
      .replace(ngVersionPlaceholderRegex, config.angularVersion)
      .replace(versionPlaceholderRegex, config.projectVersion);

    writeFileSync(filePath, fileContent);
  });
}

/** Finds all files in the specified package dir where version placeholders are included. */
function findFilesWithPlaceholders(packageDir) {
  const findCommand = buildPlaceholderFindCommand(packageDir);
  return spawnSync(findCommand.binary, findCommand.args).stdout
    .toString()
    .split(/[\n\r]/)
    .filter(String);
}

/** Builds the command that will be executed to find all files containing version placeholders. */
function buildPlaceholderFindCommand(packageDir) {
  if (platform() === 'win32') {
    return {
      binary: 'findstr',
      args: ['/msi', `${ngVersionPlaceholderText} ${versionPlaceholderText}`, `${packageDir}\\*`]
    };
  } else {
    return {
      binary: 'grep',
      args: ['-ril', `${ngVersionPlaceholderText}\\|${versionPlaceholderText}`, packageDir]
    };
  }
}

function createEntryPointPackageJson(destDir, packageName, entryPointName) {
  const content = {
    name: `@zuz/${packageName}/${entryPointName}`,
    typings: `../${entryPointName}.d.ts`,
    main: `../bundles/${packageName}-${entryPointName}.umd.js`,
    module: `../esm5/${entryPointName}.es5.js`,
    es2015: `../esm2015/${entryPointName}.js`,
  };

  writeFileSync(join(destDir, 'package.json'), JSON.stringify(content, null, 2), 'utf-8');
}
