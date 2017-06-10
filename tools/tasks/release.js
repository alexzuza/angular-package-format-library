const path = require('path');
const gulp = require('gulp');

const runSequence = require('run-sequence');
const gulpClean = require('gulp-clean');
const config = require('../../build-config');

const htmlmin = require('gulp-htmlmin');
const composeRelease = require('./build');

const tsc = require('@angular/tsc-wrapped');

const {packagesDir, outputDir} = config;

const packageRoot = path.join(packagesDir, 'lib');
const packageOut = path.join(outputDir, 'packages', 'lib');
const htmlGlob = path.join(packageRoot, '**/*.html');
const tsconfigBuild = path.join(packageRoot, 'tsconfig-build.json');




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

      gulp.task(`build`, (done) => runSequence([`build:esm`, `assets`],
        // Inline assets into ESM output.
        //`assets:inline`,
        // Build bundles on top of inlined ESM output.
        //`build:bundles`,
        done));

            gulp.task(`build:esm`, () => tsc.main(tsconfigBuild, {basePath: packageRoot}));

            gulp.task(`assets`, () => gulp.src(htmlGlob).pipe(htmlmin(htmlMinifierOptions)).pipe(gulp.dest(packageOut)));


