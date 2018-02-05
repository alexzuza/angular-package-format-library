const path = require('path');
const config = require('../../build-config');
const {writeFileSync, readFileSync} = require('fs');
const {platform} = require('os');
const {spawnSync} = require('child_process');
const inlinePackageMetadataFiles = require('./metadata-inlining');

const {packagesDir, outputDir, licenseBanner} = config;
const bundlesDir = path.join(outputDir, 'bundles');

/* Copy files function */
{
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

    // Copy all d.ts and metadata files to the `typings/` directory
    copyFiles(packagePath, '**/*.+(d.ts|metadata.json)', path.join(releasePath, 'typings'));

    // Copy UMD bundles.
    copyFiles(bundlesDir, `${packageName}.umd?(.min).js?(.map)`, path.join(releasePath, 'bundles'));


    // Copy ES5 bundles.
    copyFiles(bundlesDir, `${packageName}.es5.js?(.map)`, path.join(releasePath, 'esm5'));
    // copyFiles(path.join(bundlesDir, name), `*.es5.js?(.map)`, join(releasePath, 'esm5'));

    // Copy ES2015 bundles
    copyFiles(bundlesDir, `${packageName}.js?(.map)`, path.join(releasePath, 'esm2015'));
    copyFiles(path.join(bundlesDir, packageName), `!(*.es5|*.umd).js?(.map)`, path.join(releasePath, 'esm2015'));

    copyFiles(packagesDir, 'README.md', releasePath);
    copyFiles(sourcePath, 'package.json', releasePath);

    replaceVersionPlaceholders(releasePath);
    createTypingsReexportFile(releasePath, packageName);
    createMetadataReexportFile(releasePath, packageName);

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
