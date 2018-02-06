const { spawn } = require('child_process');
const path = require('path');
const { join } = path;
const { getSecondaryEntryPointsForPackage } = require('./secondary-entry-points');
const { packagesDir, outputDir } = require('../../build-config');

const PackageBundler = require('./bundle.model');
const buildTsconfigName = 'tsconfig-build.json';

class PackageModel {

  constructor(namespace, name, exportsSecondaryEntryPointsAtRoot) {
    this.namespace = namespace;
    this.name = name;
    this.sourceDir = join(packagesDir, name);
    this.outputDir = join(outputDir, 'packages', name);
    this.esm5OutputDir = join(outputDir, 'packages', name, 'esm5');
    this.bundler = new PackageBundler(this);

    this.exportsSecondaryEntryPointsAtRoot = !!exportsSecondaryEntryPointsAtRoot;
    this.entryFilePath = join(this.outputDir, 'index.js');
  }

  get secondaryEntryPointsByDepth() {
    this.cacheSecondaryEntryPoints();
    return this._secondaryEntryPointsByDepth;
  }

  /** Secondary entry points for the package. */
  get secondaryEntryPoints() {
    this.cacheSecondaryEntryPoints();
    return this._secondaryEntryPoints;
  }

  /** Compiles the package sources with all secondary entry points. */
  async compile() {
    // Compile all secondary entry-points with the same depth in parallel, and each separate depth
    // group in sequence. This will look something like:
    // Depth 0: coercion, platform, keycodes, bidi
    // Depth 1: a11y, scrolling
    // Depth 2: overlay
    for (const entryPointGroup of this.secondaryEntryPointsByDepth) {
      await Promise.all(entryPointGroup.map(p => this._compileBothTargets(p)));
    }

    // Compile the primary entry-point.
    await this._compileBothTargets();
  }

  async _compileBothTargets(p = '') {
    return compileEntryPoint(this, buildTsconfigName, p)
      .then(() => compileEntryPoint(this, buildTsconfigName, p, this.esm5OutputDir))
  }

  /** Creates all bundles for the package and all associated entry points. */
  async createBundles() {
    await this.bundler.createBundles();
  }

  /** Stores the secondary entry-points for this package if they haven't been computed already. */
  cacheSecondaryEntryPoints() {
    if (!this._secondaryEntryPoints) {
      this._secondaryEntryPointsByDepth = getSecondaryEntryPointsForPackage(this);
      this._secondaryEntryPoints =
        this._secondaryEntryPointsByDepth.reduce((list, p) => list.concat(p), []);
    }
  }
}

module.exports = PackageModel;


async function compileEntryPoint(buildPackage, tsconfigName, secondaryEntryPoint = '', es5OutputPath) {
  const entryPointPath = join(buildPackage.sourceDir, secondaryEntryPoint);
  const entryPointTsconfigPath = join(entryPointPath, tsconfigName);
  const ngcFlags = ['-p', entryPointTsconfigPath];

  if (es5OutputPath) {
    ngcFlags.push('--outDir', es5OutputPath, '--target', 'ES5');
  }

  return ngcCompile(ngcFlags).catch((e) => {
    const error = `Failed to compile ${secondaryEntryPoint} using ${entryPointTsconfigPath}`;
    console.error(error, e);
    return Promise.reject(error);
  });
}


function ngcCompile(flags) {
  return new Promise((resolve, reject) => {
    const ngcPath = path.resolve('./node_modules/.bin/ngc');
    const childProcess = spawn(ngcPath, flags, { shell: true });

    // Pipe stdout and stderr from the child process.
    childProcess.stdout.on('data', (data) => console.log(`${data}`));
    childProcess.stderr.on('data', (data) => console.error(`${data}`));
    childProcess.on('exit', (exitCode) => exitCode === 0 ? resolve() : reject());
  });
}
