const { spawn } = require('child_process');

class PackageModel {
  constructor(name) {
    this.name = name;
  }


  compile() {

  }
}

module.exports = PackageModel;


function ngcCompile(flags) {
  return new Promise((resolve, reject) => {
    const ngcPath = path.resolve('./node_modules/.bin/ngc');
    const childProcess = spawn(ngcPath, flags, {shell: true});

    // Pipe stdout and stderr from the child process.
    childProcess.stdout.on('data', (data) => console.log(`${data}`));
    childProcess.stderr.on('data', (data) => console.error(`${data}`));
    childProcess.on('exit', (exitCode) => exitCode === 0 ? resolve() : reject());
  });
}
