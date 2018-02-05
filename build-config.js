const { join } = require('path');

/** Current version of the project*/
const buildVersion = require('./package.json').version;
const angularVersion = '^5.0.0';

/** License that will be placed inside of all created bundles. */
const buildLicense = `/**
  * @license Zuz Lib v${buildVersion}
  * Copyright (c) ${(new Date()).getFullYear()}
  * License: MIT
  */`;

module.exports = {
  projectVersion: buildVersion,
  angularVersion: angularVersion,
  projectDir: __dirname,
  packagesDir: join(__dirname, 'src'),
  outputDir: join(__dirname, 'dist'),
  licenseBanner: buildLicense,
  packageName: 'lib'
};
