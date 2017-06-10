const gulp = require('gulp');
const runSequence = require('run-sequence');
const gulpClean = require('gulp-clean');

const buildConfig = require('../../build-config');


console.log(gulpClean);
gulp.task('clean', () => {
  return gulp.src(buildConfig.outputDir, { read: false })
             .pipe(gulpClean(null))
});

task(`lib:build`, sequenceTask(
  // Build ESM and assets output.
  [`lib:build:esm`, `lib:assets`],
  // Inline assets into ESM output.
  `${packageName}:assets:inline`,
  // Build bundles on top of inlined ESM output.
  `${packageName}:build:bundles`,
));


gulp.task(`lib:clean-build`, sequenceTask('clean', `lib:build`));


task(':build:devapp:ts', tsBuildTask(tsconfigPath));
/*task(':build:devapp:scss', sassBuildTask(outDir, appDir));
task(':build:devapp:assets', copyTask(appDir, outDir));*/



gulp.task('build:dev', (done) => runSequence('lib:clean-build', ':build:dev:ts', ':build:dev:assets', done));

gulp.task('serve', ['build:dev'], (done) => runSequence(':serve:dev', 'material:watch', ':watch:dev', done));


/*
import {
  sassBuildTask, tsBuildTask, copyTask, buildAppTask, sequenceTask, triggerLivereload,
  serverTask
} from '../util/task_helpers';
const path = require('path');
import {copyFiles} from '../util/copy-files';
import {buildConfig} from '../packaging/build-config';


const {outputDir, packagesDir, projectDir} = buildConfig;


const appDir = path.join(packagesDir, 'demo-app');
const outDir = join(outputDir, 'packages', 'demo-app');

/!** Path to the output of the Material package. *!/
const materialOutPath = join(outputDir, 'packages', 'material');



task(':watch:devapp', () => {
  watch(join(appDir, '**!/!*.ts'), [':build:dev:ts', triggerLivereload]);
  watch(join(appDir, '**!/!*.html'), [':build:dev:assets', triggerLivereload]);

  // The themes for the demo-app are built by the demo-app using the SCSS mixins from Material.
  // Therefore when the CSS files have been changed the SCSS mixins have been refreshed and
  // copied over. Rebuilt the theme CSS using the updated SCSS mixins.
  watch(join(materialOutPath, '**!/!*.css'), [':build:dev:scss', triggerLivereload]);
});

/!** Path to the demo-app tsconfig file. *!/
const tsconfigPath = join(appDir, 'tsconfig-build.json');

task(':build:dev:ts', tsBuildTask(tsconfigPath));
task(':build:dev:scss', sassBuildTask(outDir, appDir));
task(':build:dev:assets', copyTask(appDir, outDir));
task('build:dev', buildAppTask('dev'));

task(':serve:dev', serverTask(outDir, true));

task('serve:dev', ['build:dev'], sequenceTask(
  [':serve:dev', 'material:watch', ':watch:dev']
));

*/
