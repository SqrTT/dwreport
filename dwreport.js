var filewalker = require('filewalker'),
	dwhint = require('dwhint'),
	fs = require('fs'),
	shjs = require("shelljs"),
	JSHINT = require("dwhint").JSHINT,
	pathToProject = '/home/tolik/git/ecom-oneapp/cartridges/';

var count = 0;
function lint(code, results, config, data, file) {
	var globals;
	var lintData;
	var buffer = [];

	config = config || {};
	config = JSON.parse(JSON.stringify(config));

	if (config.prereq) {
		config.prereq.forEach(function (fp) {
			fp = path.join(config.dirname, fp);
			if (shjs.test("-e", fp))
				buffer.push(shjs.cat(fp));
		});
		delete config.prereq;
	}

	if (config.globals) {
		globals = config.globals;
		delete config.globals;
	}

	delete config.dirname;
	buffer.push(code);
	buffer = buffer.join("\n");
	buffer = buffer.replace(/^\uFEFF/, ""); // Remove potential Unicode BOM.

	if (!JSHINT(buffer, config, globals)) {
		JSHINT.errors.forEach(function (err) {
			if (err) {
				results.push({ file: file || "stdin", error: err });
			}
		});
	}

	lintData = JSHINT.data();

	if (lintData) {
		lintData.file = file || "stdin";
		lintData.error = [];
		lintData.info = [];
		lintData.warn = [];
		delete lintData.options;
		delete lintData.globals;
		lintData.errors.forEach(function (err) {
			if (err) {
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

var gResults = [];
var gData = [];

filewalker(pathToProject)
	.on('file', function(p, s) {
		//debugger;
		var code, res, isDS;
		if ((p).indexOf('min.js') === -1 && /(\.js|\.ds)$/.test(p)) {
			//if (count>15) return;

			isDS = p.indexOf('.ds') !== -1;
			count++;
			console.log('file: %s, %d bytes', p, s.size);
			try {
				code = shjs.cat(pathToProject + p);
			} catch (err) {
				console.error("Can't open " + file + ' e:' + err);
				exports.exit(1);
			}
		//	debugger;
			res = lint(code, gResults, {ext_file : isDS ? 'ds' : 'js', name_file : p}, gData, p);
		}
	})
	.on('error', function(err) {
		console.error(err);
	})
	.on('done', function() {

		//console.log(gData);
		debugger;
		fs.writeFileSync(process.cwd() + '/web/output.json', JSON.stringify(gData));
		console.log('%d dirs, %d files', this.dirs, count);
	})
.walk();


