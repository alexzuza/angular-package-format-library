const path = require('path');
const gulp = require('gulp');
const runSequence = require('run-sequence');
const gulpClean = require('gulp-clean');
const htmlMin = require('gulp-htmlmin');
const cleanCss = require('gulp-clean-css');

const PackageModel = require('./tools/build/package.model');

const config = require('./build-config');
const inlineResourcesForDirectory = require('./tools/inline-resources');
const buildPackageBundles = require('./tools/packaging/build-bundles');
const composeRelease = require('./tools/packaging/build');


const { packageName, packagesDir, outputDir } = config;

const packageRoot = path.join(packagesDir, 'lib');
const packageOut = path.join(outputDir, 'packages', 'lib');
const packageEsm5Out = path.join(packageOut, 'esm5');
const esmMainFile = path.join(packageOut, 'index.js');


function getTsConfig(subPackage) {
  return path.join(packageRoot, subPackage || '', 'tsconfig-build.json');
}

const htmlGlob = path.join(packageRoot, '**/*.html');
const stylesGlob = path.join(packageRoot, '**/*.css');


const htmlMinifierOptions = {
  collapseWhitespace: true,
  removeComments: true,
  caseSensitive: true,
  removeAttributeQuotes: false
};


const pkg = new PackageModel('lib');


gulp.task(`build-release:clean`, (done) => runSequence('clean', 'build-release', done));

  gulp.task('clean', () => gulp.src(outputDir, { read: false }).pipe(gulpClean(null)));

  gulp.task('build-release', ['prepare-release'], () =>  composeRelease('lib'));

    gulp.task('prepare-release', ['build']);

      gulp.task(`build`, (done) => runSequence(
        `assets`,
        'build:esm',
        // Inline assets into ESM output.
        `assets:inline`,
        // Build bundles on top of inlined ESM output.
        `build:bundles`,
        done));

        gulp.task(`assets`, ['assets:html', 'assets:css']);

        gulp.task(`assets:html`, () => gulp.src(htmlGlob)
          .pipe(htmlMin(htmlMinifierOptions))
          .pipe(gulp.dest(packageOut))
          .pipe(gulp.dest(packageEsm5Out)));

        gulp.task(`assets:css`, () => gulp.src(stylesGlob).pipe(cleanCss())
          .pipe(gulp.dest(packageOut))
          .pipe(gulp.dest(packageEsm5Out)));


        gulp.task('build:esm', () => pkg.compile());
        /*  gulp.task('compile:button', () => ngcCompile(['-p', getTsConfig('button')]));

          gulp.task('compile:input', () => ngcCompile(['-p', getTsConfig('input')]));

          gulp.task('compile:button:es5', () => ngcCompile(['-p', getTsConfig('button'), '--outDir', packageEsm5Out, '--target', 'ES5' ]));

          gulp.task('compile:input:es5', () => ngcCompile(['-p', getTsConfig('input'), '--outDir', packageEsm5Out, '--target', 'ES5']));*/


      gulp.task(`assets:inline`, () => inlineResourcesForDirectory(packageOut));

      gulp.task(`build:bundles`, () => buildPackageBundles(esmMainFile, packageName));

