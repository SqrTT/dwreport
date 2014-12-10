/* globals require, console */
var shjs = require('shelljs'),
	fs = require('fs'),
	JSHINT = require('dwhint').JSHINT,
	path = require('path'),
	_ = require('lodash');

// Storage for memoized results from find file
// Should prevent lots of directory traversal &
// lookups when liniting an entire project
var findFileResults = {};

/**
 * Searches for a file with a specified name starting with
 * 'dir' and going all the way up either until it finds the file
 * or hits the root.
 *
 * @param {string} name filename to search for (e.g. .jshintrc)
 * @param {string} dir  directory to start search from (default:
 * current working directory)
 *
 * @returns {string} normalized filename
 */
function findFile(name, dir) {
	dir = dir || process.cwd();

	var filename = path.normalize(path.join(dir, name)),
		parent;

	if (findFileResults[filename] !== undefined) {
		return findFileResults[filename];
	}

	parent = path.resolve(dir, '../');

	if (shjs.test('-e', filename)) {
		findFileResults[filename] = filename;
		return filename;
	}

	if (dir === parent) {
		findFileResults[filename] = null;
		return null;
	}

	return findFile(name, parent);
}


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
		if (lintData.errors) {
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
		}
		delete lintData.errors;

		data.push(lintData);
	}
}

function sortNumber(a, b) {
	return a - b;
}

function getFiles(dir, files_) {
	var i, name, files;
	files_ = files_ || [];
	if (typeof files_ === 'undefined') {
		files_ = [];
	}

	files = fs.readdirSync(dir);
	for (i in files) {
		if (!files.hasOwnProperty(i)) {
			continue;
		}
		name = dir + '/' + files[i];
		if (fs.statSync(name).isDirectory()) {
			getFiles(name, files_);
		} else {
			files_.push(name);
		}
	}
	return files_;
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
/**
 * Tries to find a configuration file in either project directory
 * or in the home directory. Configuration files are named
 * '.jshintrc'.
 *
 * @param {string} file path to the file to be linted
 * @returns {string} a path to the config file
 */
function findConfig(file) {
	var dir  = path.dirname(path.resolve(file)),
		envs = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE,
		home = path.normalize(path.join(envs, '.jshintrc')),
		proj = findFile('.jshintrc', dir);

	if (proj) {
		return proj;
	}

	if (shjs.test('-e', home)) {
		return home;
	} else {
		return null;
	}
}



exports.validate = function (projDirPath, opts, done, verbose) {
	var gResults = [],
		fileList = [],
		exp = {},
		gData = [];
	if (_.isString(projDirPath)) {
		projDirPath = [projDirPath];
	}

	_.forEach(projDirPath, function (path) {
		getFiles(path.replace(/\/$/, ''), fileList);
	});

	_.forEach(fileList, function (p) {
		//debugger;
		var code,
			prConf,
			config = {
				'ext_file' : p.indexOf('.ds') !== -1 ? 'ds' : 'js',
				'name_file' : p
			},
			sloc = require('sloc');

		if ((p).indexOf('min.js') === -1 && /(\.js|\.ds)$/.test(p)) {

			prConf = findConfig(p);
			if (prConf) {
				try {
					prConf = JSON.parse(shjs.cat(prConf));

				} catch (err) {
					console.error('Can\'t parse config file: ' + prConf);
				}
			}


			try {
				code = shjs.cat(p);
			} catch (err) {
				console.error('Can\'t open ' + p + ' e:' + err);
				exports.exit(1);
			}
			if (verbose) {
				console.log('file: %s, %d bytes', p, code.length);
			};
			//	debugger;
			lint(code, gResults, _.extend(config, prConf), gData, p);
			gData[gData.length - 1].sloc = sloc(code, 'js', {});

		}
	});


	_.forEach(gData, function (file) {
		var entry = {
			info : file.info,
			warn : file.warn,
			error : file.error,
			functionCount : file.functions.length,
			sloc : file.sloc,
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

			complexityArr.push(complexity);
			if (complexity < entry.complexity.min) {
				entry.complexity.min = complexity;
			}
			if (complexity > entry.complexity.max) {
				entry.complexity.max = complexity;
			}

			statements = fn.metrics.statements;
			entry.statements.sum += statements;


			statementsArr.push(statements);
			if (statements < entry.statements.min) {
				entry.statements.min = statements;
			}
			if (statements > entry.statements.max) {
				entry.statements.max = statements;
			}
		});
		if (entry.functionCount) {
			entry.complexity.avg = entry.complexity.sum / entry.functionCount;
			entry.statements.avg = entry.statements.sum / entry.functionCount;

			entry.complexity.mediana = calcMediana(complexityArr);
			entry.statements.mediana = calcMediana(statementsArr);
		}
		exp[file.file] = entry;
	});
	done(exp);
},

exports.calcTotals = function (data) {
	var totals = {
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
			},
			sloc : {
				block : 0,
				comment : 0,
				empty : 0,
				mixed : 0,
				single : 0,
				source : 0,
				total : 0
			}
		},
		complexityArrTtl = [],
		statementsArrTtl = [];

	_.forEach(data, function (entry) {
		totals.info += entry.info.length;
		totals.warn += entry.warn.length;
		totals.error += entry.error.length;
		totals.functionCount += entry.functionCount;
		totals.complexity.sum += entry.complexity.sum;

		if (entry.complexity.min < totals.complexity.min) {
			totals.complexity.min = entry.complexity.min;
		}
		if (entry.complexity.max > totals.complexity.max) {
			totals.complexity.max = entry.complexity.max;
		}

		totals.statements.sum += entry.statements.sum;
		if (entry.statements.min < totals.statements.min) {
			totals.statements.min = entry.statements.min;
		}
		if (entry.statements.max > totals.statements.max) {
			totals.statements.max = entry.statements.max;
		}

		complexityArrTtl.push(entry.complexity.sum);
		statementsArrTtl.push(entry.statements.sum);

		//sloc
		_.forEach(totals.sloc, function (value, index) {
			totals.sloc[index] += entry.sloc[index];
		});

	});

	totals.complexity.avg = totals.complexity.sum / _.size(data);
	totals.statements.avg = totals.statements.sum / _.size(data);
	totals.complexity.mediana = calcMediana(complexityArrTtl);
	totals.statements.mediana = calcMediana(statementsArrTtl);
	totals.filesCount = _.size(data);

	return totals;
};
