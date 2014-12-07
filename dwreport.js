/* globals require, console */
var fs = require('fs'),
	reporter = require('./src/main'),
	minimist = require('minimist'),
	args = minimist(process.argv.slice(2));

reporter.validate(args.path, null, function (result) {
	console.log(reporter.calcTotals(result));
	fs.writeFileSync(process.cwd() + '/output.json', JSON.stringify(result));
});

