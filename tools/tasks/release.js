const path = require('path');
const gulp = require('gulp');

const runSequence = require('run-sequence');
const gulpClean = require('gulp-clean');
const config = require('../../build-config');

const htmlMin = require('gulp-htmlmin');
const cleanCss = require('gulp-clean-css');
const inlineResourcesForDirectory = require('../inline-resources');
const buildPackageBundles = require('../packaging/build-bundles');

const composeRelease = require('../packaging/build');

const tsc = require('@angular/tsc-wrapped');

const { packageName, packagesDir, outputDir } = config;

const packageRoot = path.join(packagesDir, 'lib');
const packageOut = path.join(outputDir, 'packages', 'lib');
const esmMainFile = path.join(packageOut, 'index.js');

const tsconfigBuild = path.join(packageRoot, 'tsconfig-build.json');

const htmlGlob = path.join(packageRoot, '**/*.html');
const stylesGlob = path.join(packageRoot, '**/*.css');


const htmlMinifierOptions = {
  collapseWhitespace: true,
  removeComments: true,
  caseSensitive: true,
  removeAttributeQuotes: false
};

gulp.task(`build-release:clean`, (done) => runSequence('clean', 'build-release', done));

  gulp.task('clean', () => gulp.src(outputDir, { read: false }).pipe(gulpClean(null)));

  gulp.task('build-release', ['prepare-release'], () =>  composeRelease('lib'));

    gulp.task('prepare-release', ['build']);

      gulp.task(`build`, (done) => runSequence(
        [`build:esm`, `assets`],
        // Inline assets into ESM output.
        `assets:inline`,
        // Build bundles on top of inlined ESM output.
        `build:bundles`,
        done));

            gulp.task(`build:esm`, () => tsc.main(tsconfigBuild, {basePath: packageRoot}));

            gulp.task(`assets`, ['assets:html', 'assets:css']);

                gulp.task(`assets:html`, () => gulp.src(htmlGlob).pipe(htmlMin(htmlMinifierOptions)).pipe(gulp.dest(packageOut)));

                gulp.task(`assets:css`, () => gulp.src(stylesGlob).pipe(cleanCss()).pipe(gulp.dest(packageOut)));

            gulp.task(`assets:inline`, () => inlineResourcesForDirectory(packageOut));

            gulp.task(`build:bundles`, () => buildPackageBundles(esmMainFile, packageName));


