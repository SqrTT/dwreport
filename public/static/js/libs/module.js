// define/require part
// more details here http://confluence.ontrq.com/display/TLGOA/Modules
var define;
(function (global, undefined) {
	var modules = {},
		registredModules = {},
		ASTERISK = '*',
		APP = 'app.',
		MAX_LOOP_DEEP = 30,
		SPLITTER = '.',
		NOT_FOUND = 'Module not found: ',
		requires = [],
		modulesMap = {};

	function mapModuleName(defName, reqName) {
		if (defName && modulesMap[defName] && modulesMap[defName][reqName]) {
			return modulesMap[defName][reqName];
		}
		if (modulesMap[ASTERISK] && modulesMap[ASTERISK][reqName]) {
			return modulesMap[ASTERISK][reqName];
		}
		return reqName;
	}

	function require(name) {
		var module,
			names,
			current,
			i;
		
		name = mapModuleName((requires.length && requires[requires.length - 1]), name);
		if (!registredModules[name] && name.indexOf(APP) === 0) {
			names = name.split(SPLITTER);
			current = global;
			
			for (i = 0; i < names.length; i++) {
				if (current[names[i]] !== undefined) {
					current = current[names[i]];
				} else {
					throw NOT_FOUND + name;
				}
			}
			return current;
		} else if (modules[name]) {
			return modules[name];
		} else if (registredModules[name]) {
			if (requires.length > MAX_LOOP_DEEP || requires.indexOf(name) > 0) {
				throw 'Loop detected: ' + requires + '->' + name;
			} else {
				requires.push(name);
				module = {exports : {}, name : name};
				registredModules[name].factory.call(module.exports, require, module.exports, module);
				modules[name] = module.exports;
				requires.pop();
				return modules[name];
			}
		} else {
			throw NOT_FOUND + name;
		}
	}

	if (!global.define) {
		global.define = function define(moduleName, factory) {
			registredModules[moduleName] = {factory : factory, name: moduleName};
			if (moduleName.indexOf(APP) === 0) {
				var names = moduleName.split(SPLITTER),
					current = global,
					i = 0;
	
				for (; i < names.length - 1; i++) {
					if (!current[names[i]]) {
						current[names[i]] = {};
					}
					current = current[names[i]];
				}
				current[names[i]] = require(moduleName);
			}
		};
		global.define.map = modulesMap;
	}
}(this));
/// define some basic modules
define('document', function (require, exports, module) {
	module.exports = document;
});
define('window', function (require, exports, module) {
	module.exports = window;
});
define('jquery', function (require, exports, module) {
	var window = require('window');
	if (window.jQuery) {
		module.exports = window.jQuery;
	} else {
		throw 'jQuery is undefined!';
	}
});
define('lodash', function (require, exports, module) {
	var window = require('window'),
		lodash = window._;
	if (lodash) {
		module.exports = lodash;
		// reconfiguration template engine to avoid conflicts with demandware template engine
		lodash.templateSettings.escape = /{%-([\s\S]+?)%}/g;
		lodash.templateSettings.evaluate = /{%([\s\S]+?)%}/g;
		lodash.templateSettings.interpolate = /{%=([\s\S]+?)%}/g;
	} else {
		throw 'lodash is undefined!';
	}
});

define('$', function (require, exports, module) {
	module.exports = require('jquery');
});
define('$doc', function (require, exports, module) {
	module.exports = require('$')(require('document'));
});
define('$win', function (require, exports, module) {
	module.exports = require('$')(require('window'));
});
define('$body', function (require, exports, module) {
	module.exports = require('$')('body');
});
define('log', function (require, exports, module) {
	module.exports = require('window').console;
});
define('ebus', function (require, exports, module) {
	module.exports = require('$doc');
});
