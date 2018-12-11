// import 'symbol-observable';
console.error('hello from' + process.title);

let cli;
cli = require('./cli');

if ('default' in cli) {
  cli = cli['default'];
}

cli({ cliArgs: process.argv.slice(2) })
  .then((exitCode: number) => {
    console.log(`exit code ${exitCode}`);
    process.exit(exitCode);
  })
  .catch((error: Error) => {
    console.error('Unknown error :' + error.toString());
    process.exit(127);
  });
