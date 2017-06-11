/**
 * Build configuration for the packaging tool.
 */
const { join } = require('path');

/** Current version of the project*/
const buildVersion = require('./package.json').version;

/** License that will be placed inside of all created bundles. */
const buildLicense = `/**
  * @license Zuz Lib v${buildVersion}
  * Copyright (c) 2017
  * License: MIT
  */`;

module.exports = {
  projectVersion: buildVersion,
  projectDir: __dirname,
  packagesDir: join(__dirname, 'src'),
  outputDir: join(__dirname, 'dist'),
  licenseBanner: buildLicense,
  packageName: 'lib'
};
