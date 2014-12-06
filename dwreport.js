/* globals require, console */
var fs = require('fs'),
	reporter = require('./src/main'),
	pathToProject = '/home/tolik/git/ecom-oneapp/cartridges/';


reporter.validate(pathToProject, null, function (result) {
	console.log(reporter.calcTotals(result));
	fs.writeFileSync(process.cwd() + '/output.json', JSON.stringify(result));
});
