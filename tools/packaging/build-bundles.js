const path = require('path');
const ts = require('typescript');
const sorcery = require('sorcery');

const buildConfig = require('../../build-config');

const createRollupBundle = require('./rollup-helpers');

const transpileFile = require('./typescript-transpile');

const bundlesDir = path.join(buildConfig.outputDir, 'bundles');


/**
 * Finds the original sourcemap of the file and maps it to the current file.
 * This is useful when multiple transformation happen (e.g TSC -> Rollup -> Uglify)
 **/
function remapSourcemap(sourceFile) {
  return sorcery.load(sourceFile).then(chain => chain.write());
}

function rollup(config) {
  return createRollupBundle(config).then(() => remapSourcemap(config.dest))
}


/** Builds the bundles for the specified package. */
module.exports = function buildPackageBundles(entryFile, packageName) {
  const moduleName = `ng.${packageName}`;

  // List of paths to the package bundles.
  const fesm2015File = path.join(bundlesDir, `${packageName}.js`);
  const fesm2014File = path.join(bundlesDir, `${packageName}.es5.js`);
  const umdFile = path.join(bundlesDir, `${packageName}.umd.js`);
  const umdMinFile = path.join(bundlesDir, `${packageName}.umd.min.js`);

  // FESM-2015 bundle config
  const fesm2015Config = {
    moduleName: moduleName,
    entry: entryFile,
    dest: fesm2015File,
    format: 'es',
  };

  // UMD bundle of FESM-2014 config
  const umdConfig = {
    moduleName: moduleName,
    entry: fesm2014File,
    dest: umdFile,
    format: 'umd',
  };

  // Create UMD min bundle of FESM-2014 output.
  const umdMinConfig = {
    moduleName: moduleName,
    entry: fesm2014File,
    dest: umdMinFile,
    format: 'umd',
    minify: true
  };

  function transpile() {
    // Downlevel FESM-2015 file to ES5.
    transpileFile(fesm2015File, fesm2014File, {
      importHelpers: true,
      target: ts.ScriptTarget.ES5,
      module: ts.ModuleKind.ES2015,
      allowJs: true
    });
    return remapSourcemap(fesm2014File);
  }

  // Build FESM-2015 bundle file.
  return rollup(fesm2015Config)
    .then(() => {
            const bundles = [
              transpile(),
              // Create UMD bundle of FESM-2014 output.
              rollup(umdConfig),
              // Create UMD min bundle of FESM-2014 output.
              rollup(umdMinConfig)
            ];

            return Promise.all(bundles)
              .then(() => console.log('All bundles generated successfully.'))
          });
};

