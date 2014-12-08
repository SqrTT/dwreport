/* globals require, console */
var fs = require('fs'),
	minimist = require('minimist'),
	args = minimist(process.argv.slice(2));

if (!args.path && !args.server) {
	console.log('Usage:\n --server - run in server mode' +
		'\n --path - path to project (can be specified multiple times)' +
		'\n -o, --saveto - output filename to save(default \'output\')' +
		'\n --format - output format json or csv(default)' +
		'\n -v - verbose output');
	return;
}

function saveJson(data, filename) {
	console.log(data);
	fs.writeFileSync(filename, JSON.stringify(data));
}

function saveCSV(data, filename) {
	var csvString = [
		new Date(),
		data.error,
		data.warn,
		data.info,
		data.functionCount,
		data.complexity.sum,
		data.complexity.min,
		data.complexity.max,
		data.complexity.avg,
		data.complexity.mediana,
		data.statements.sum,
		data.statements.min,
		data.statements.max,
		data.statements.avg,
		data.statements.mediana,
		data.sloc.block,
		data.sloc.comment,
		data.sloc.empty,
		data.sloc.mixed,
		data.sloc.single,
		data.sloc.source,
		data.sloc.total
	];
	csvString = csvString.join(',');
	fs.writeFileSync(filename, JSON.stringify(csvString));
	console.log(csvString);

}

if (args.server) {
	require('./src/server');
} else {
	var main = require('./src/main');

	main.validate(args.path, null, function (result) {
		if (args.format === 'json') {
			saveJson(main.calcTotals(result), args.o || args.saveto || (process.cwd() + '/output.json'));
		} else {
			saveCSV(main.calcTotals(result), args.o || args.saveto || (process.cwd() + '/output.csv'));
		}
	}, args.v);
}


