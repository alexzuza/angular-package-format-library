const {join} = require('path');
const {getSubdirectoryNames} = require('./secondary-entry-points');
const {packagesDir} = require('../../build-config');
const libSecondaryEntryPoints = getSubdirectoryNames(join(packagesDir, 'lib'));


const dashCaseToCamelCase = (str) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

/** Object with all material entry points in the format of Rollup globals. */
const rollupLibEntryPoints = libSecondaryEntryPoints.reduce((globals, entryPoint) => {
  globals[`@zuz/lib/${entryPoint}`] = `ng.lib.${dashCaseToCamelCase(entryPoint)}`;
  return globals;
}, {});

const rollupGlobals = {
  // Import tslib rather than having TypeScript output its helpers multiple times.
  // See https://github.com/Microsoft/tslib
  'tslib': 'tslib',

  // Angular dependencies
  '@angular/animations': 'ng.animations',
  '@angular/core': 'ng.core',
  '@angular/common': 'ng.common',
  '@angular/forms': 'ng.forms',
  '@angular/http': 'ng.http',
  '@angular/platform-browser': 'ng.platformBrowser',
  '@angular/platform-browser-dynamic': 'ng.platformBrowserDynamic',
  '@angular/platform-browser/animations': 'ng.platformBrowser.animations',

  // Local Angular packages inside of Material.
  '@zuz/lib': 'ng.lib',
  ...rollupLibEntryPoints,

  // Rxjs dependencies
  'rxjs/BehaviorSubject': 'Rx',
  'rxjs/Observable': 'Rx',
  'rxjs/Subject': 'Rx',
  'rxjs/Subscription': 'Rx',
  'rxjs/add/observable/combineLatest': 'Rx.Observable',
  'rxjs/add/observable/forkJoin': 'Rx.Observable',
  'rxjs/add/observable/fromEvent': 'Rx.Observable',
  'rxjs/add/observable/merge': 'Rx.Observable',
  'rxjs/add/observable/of': 'Rx.Observable',
  'rxjs/add/observable/throw': 'Rx.Observable',
  'rxjs/add/operator/auditTime': 'Rx.Observable.prototype',
  'rxjs/add/operator/catch': 'Rx.Observable.prototype',
  'rxjs/add/operator/debounceTime': 'Rx.Observable.prototype',
  'rxjs/add/operator/do': 'Rx.Observable.prototype',
  'rxjs/add/operator/filter': 'Rx.Observable.prototype',
  'rxjs/add/operator/finally': 'Rx.Observable.prototype',
  'rxjs/add/operator/first': 'Rx.Observable.prototype',
  'rxjs/add/operator/let': 'Rx.Observable.prototype',
  'rxjs/add/operator/map': 'Rx.Observable.prototype',
  'rxjs/add/operator/share': 'Rx.Observable.prototype',
  'rxjs/add/operator/startWith': 'Rx.Observable.prototype',
  'rxjs/add/operator/switchMap': 'Rx.Observable.prototype',
  'rxjs/add/operator/takeUntil': 'Rx.Observable.prototype',
  'rxjs/add/operator/toPromise': 'Rx.Observable.prototype',
};


module.exports = {
  rollupGlobals,
  dashCaseToCamelCase
};
