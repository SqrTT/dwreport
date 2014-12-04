/* globals require, console */
var filewalker = require('filewalker'),
	fs = require('fs'),
	shjs = require('shelljs'),
	JSHINT = require('dwhint').JSHINT,
	pathToProject = '/home/tolik/git/ecom-oneapp/cartridges/',
	_ = require('lodash');

var count = 0;
function lint(code, results, config, data, file) {
	var globals,
		lintData,
		buffer = [];

	config = config || {};
	config = JSON.parse(JSON.stringify(config));

	if (config.prereq) {
		config.prereq.forEach(function (fp) {
			fp = path.join(config.dirname, fp);
			if (shjs.test('-e', fp)) {
				buffer.push(shjs.cat(fp));
			}
		});
		delete config.prereq;
	}

	if (config.globals) {
		globals = config.globals;
		delete config.globals;
	}
	delete config.dirname;
	buffer.push(code);
	buffer = buffer.join('\n');
	buffer = buffer.replace(/^\uFEFF/, '');
	// Remove potential Unicode BOM.

	if (!JSHINT(buffer, config, globals)) {
		JSHINT.errors.forEach(function (err) {
			if (err) {
				results.push({
					file : file || 'stdin',
					error : err
				});
			}
		});
	}

	lintData = JSHINT.data();

	if (lintData) {
		lintData.file = file || 'stdin';
		lintData.error = [];
		lintData.info = [];
		lintData.warn = [];
		delete lintData.options;
		delete lintData.globals;
		lintData.errors.forEach(function (err) {
			if (err) {
				delete err.id;
				delete err.raw;
				delete err.scope;
				delete err.character;

				if (err.code[0] === 'W') {
					lintData.warn.push(err);
				} else if (err.code[0] === 'I') {
					lintData.info.push(err);
				} else {
					lintData.error.push(err);
				}
			}
		});
		delete lintData.errors;

		data.push(lintData);
	}
}

function sortNumber(a, b) {
	return a - b;
}

function calcMediana(inputData) {
	inputData.sort(sortNumber);

	var lengthAry = inputData.length / 2;
	if (lengthAry === Math.ceil(inputData.length / 2)) {
		return (parseFloat(inputData[lengthAry - 1]) + parseFloat(inputData[lengthAry])) / 2;
	} else {
		lengthAry = Math.ceil(lengthAry);
		return inputData[lengthAry - 1];
	}
}

var gResults = [],
    exp = {},
    totals = {
	info : 0,
	warn : 0,
	error : 0,
	functionCount : 0,
	complexity : {
		sum : 0,
		min : 10000,
		max : 0,
		avg : 0,
		mediana : 0
	},
	statements : {
		sum : 0,
		min : 10000,
		max : 0,
		avg : 0,
		mediana : 0
	}
},
    complexityArrTtl = [],
    statementsArrTtl = [],
    gData = [];

filewalker(pathToProject).on('file', function (p, s) {
	//debugger;
	var code,
		res,
		isDS;

	if ((p).indexOf('min.js') === -1 && /(\.js|\.ds)$/.test(p)) {
		//if (count>15) return;

		isDS = p.indexOf('.ds') !== -1;
		count++;
		console.log('file: %s, %d bytes', p, s.size);
		try {
			code = shjs.cat(pathToProject + p);
		} catch (err) {
			console.error('Can\'t open ' + p + ' e:' + err);
			exports.exit(1);
		}
		//	debugger;
		res = lint(code, gResults, {
			ext_file : isDS ? 'ds' : 'js',
			name_file : p
		}, gData, p);
	}
}).on('error', function (err) {
	console.error(err);
}).on('done', function () {

	_.forEach(gData, function (file) {
		totals.info += file.info.length;
		totals.warn += file.warn.length;
		totals.error += file.error.length;
		totals.functionCount += file.functions.length;

		var entry = {
			info : file.info,
			warn : file.warn,
			error : file.eror,
			functionCount : file.functions.length,
			complexity : {
				sum : 0,
				min : 10000,
				max : 0,
				avg : 0,
				mediana : 0
			},
			statements : {
				sum : 0,
				min : 10000,
				max : 0,
				avg : 0,
				mediana : 0
			}
		},
		complexityArr = [],
		statementsArr = [];

		_.forEach(file.functions, function (fn) {
			var complexity = fn.metrics.complexity,
				statements;
			entry.complexity.sum += complexity;
			totals.complexity.sum += complexity;

			complexityArr.push(complexity);
			complexityArrTtl.push(complexity);
			if (complexity < entry.complexity.min) {
				entry.complexity.min = complexity;
			}
			if (complexity > entry.complexity.max) {
				entry.complexity.max = complexity;
			}
			if (complexity < totals.complexity.min) {
				totals.complexity.min = complexity;
			}
			if (complexity > totals.complexity.max) {
				totals.complexity.max = complexity;
			}

			statements = fn.metrics.statements;
			entry.statements.sum += statements;
			totals.statements.sum += statements;


			statementsArr.push(statements);
			statementsArrTtl.push(statements);
			if (statements < entry.statements.min) {
				entry.statements.min = statements;
			}
			if (statements > entry.statements.max) {
				entry.statements.max = statements;
			}
			if (statements < totals.statements.min) {
				totals.statements.min = statements;
			}
			if (statements > totals.statements.max) {
				totals.statements.max = statements;
			}
		});
		if (entry.functionCount) {
			entry.complexity.avg = entry.complexity.sum / entry.functionCount;
			entry.statements.avg = entry.statements.sum / entry.functionCount;
			totals.complexity.avg = totals.complexity.sum / totals.functionCount;
			totals.statements.avg = totals.statements.sum / totals.functionCount;

			entry.complexity.mediana = calcMediana(complexityArr);
			entry.statements.mediana = calcMediana(statementsArr);
			totals.complexity.mediana = calcMediana(complexityArrTtl);
			totals.statements.mediana = calcMediana(statementsArrTtl);
		}
		exp[file.file] = entry;
	});
	exp.totals = totals;

	console.log(totals);
	fs.writeFileSync(process.cwd() + '/output.json', JSON.stringify(exp));
	console.log('%d dirs, %d files', this.dirs, count);
}).walk();

