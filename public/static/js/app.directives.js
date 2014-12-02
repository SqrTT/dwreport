/* global define */
define('dir.helper', function (require, exports, module) {
	module.exports = require('app.directives').helpers;
});

define('app.directives', function (require, exports, module, undefined) {
	'use strict';
	var ctrlsConfig = {},
		DIR_ATTR = 'dir',
		$doc = require('$doc'),
		dataCtrlSel = '[data-' + DIR_ATTR + ']',
		CONFIG_TPL = 'config-tpl',
		DIR_ATTR_INITED = DIR_ATTR + '-inited',
		inited = false,
		directivesTree = {
			'dir' : $doc,
			'childs' : [],
			'parent' : undefined
		},
		$ = require('$'),
		log = require('log'),
		document = require('document');
	

	log.info('Init directives controller');

	function callDir(dir, fnName, data) {
		if (dir && dir.dirInstance && $.isFunction(dir.dirInstance[fnName])) {
			return dir.dirInstance[fnName](data);
		}
	}

	function callChilds($el, fnName, data, deep) {
		var result = [];
		deep = deep || 1;

		loopOverChildDirs($el.data(DIR_ATTR_INITED), function (d) {
			result.push(callDir(d, fnName, data));
		}, deep);
		return result;
	}
	function callParents($el, fnName, data, deep) {
		var result = [];
		deep = deep || 1;
		loopOverParents($el.data(DIR_ATTR_INITED), function (d) {
			result.push(callDir(d, fnName, data));
		}, deep);
		return result;
	}

	function loopOverChildDirs(dir, callback, deep) {
		if (deep > 0 && dir && dir.childs && dir.childs.length) {
			$.each(dir.childs, function (c, currDir) {
				loopOverChildDirs(currDir, callback, deep - 1);
				callback(currDir);
			});
		}
	}

	function loopOverParents(dir, callback, deep) {
		var tempDir = dir;
		while (tempDir.parent && deep > 0) {
			tempDir = tempDir.parent;
			callback(tempDir);
			--deep;
		}
	}

	function isElInDOM($el) {
		return $el && $el[0] && $.contains(document.documentElement, $el[0]);
	}

	function isInitedDirectiveEl($el) {
		return !!$el.data(DIR_ATTR_INITED);
	}

	function buildTree(el, currEl) {
		var currDir = currEl || directivesTree,
			$child = $(el || 'html').children(),
			childs = currDir.childs,
			cel;

		$child.each(function () {
			if ($(this).data(DIR_ATTR)) {
				cel = {
					'dir' : $(this),
					'childs' : [],
					'parent' : currEl,
					dirInstance: undefined
				};
				buildTree(this, cel);
				childs.push(cel);
				return;
			}
			buildTree(this, currDir);
		});
	}

	function attachEl(el) {
		if (!inited) {
			initDirective(directivesTree);
		}
		var $el = $(el),
			$tmpEl = $el,
			newDir = {'dir' : undefined, 'childs' : [], 'parent' : undefined};


		while (!isInitedDirectiveEl($tmpEl) && $tmpEl.length) {
			$tmpEl = $tmpEl.parent();
		}
		if (!$tmpEl.length) {
			newDir.dir = $tmpEl = $doc;
		} else {
			newDir = $tmpEl.data(DIR_ATTR_INITED);
		}
		
		if (newDir.parent) {
			newDir.parent.childs.push(newDir);
		}

		buildTree($tmpEl, newDir);
		initDirective(newDir);
		// initDir
		loopOverChildDirs(newDir, function (d) {
			if (d && d.dirInstance && !d.inited) {
				callDir(d, 'initDir');
				d.initedDir = true;
			}
		}, 1e9);
		// events
		loopOverChildDirs(newDir, function (d) {
			if (d && d.dirInstance && !d.initedEvents){
				callDir(d, 'events');
				d.initedEvents = true;
			}
		}, 1e9);
	
	}
	
	function detachEl(el) {
		var $el = $(el),
			$tmpEl = $el;
		
		while (!isInitedDirectiveEl($tmpEl) && $tmpEl.length) {
			$tmpEl = $tmpEl.parent();
		}
		callChilds($tmpEl, 'destroy', undefined, 1e9);
	}
	
	

	function initDirective(dir) {
		if (dir && dir.dir && !dir.dirInstance && !isInitedDirectiveEl(dir.dir)) {
			var $this = dir.dir,
				dirData = $this.data(),
				tpl,
				tplConfig,
				Dir;

			dirData.dir = dirData.dir || 'base.dir';
			Dir = require(dirData.dir);
			if (Dir) {
				if ($.isFunction(Dir)) {
					if (dirData[CONFIG_TPL]) {
						tpl = $this.find('.' + dirData[CONFIG_TPL]);
						if (tpl.length === 1) {
							try {
								tplConfig = JSON.parse(tpl.get(0).innerHTML);
								dirData = $.extend(true, dirData, tplConfig);
							} catch (e) {
								log.error('Can\'t parse JSON form template: ' + dirData[CONFIG_TPL], e);
							}
						} else {
							log.info('Can\'t find config: ' + dirData[CONFIG_TPL]);
						}
					}
					log.debug('Init directive: ' + dirData.dir);
					dir.dirInstance = new Dir(
							$this,
							$.extend(true, ctrlsConfig[dirData.dir] || {}, dirData)
						);
					$this.data(DIR_ATTR_INITED, dir);
				} else {
					log.error('Directive should be a function:' + dirData.dir);
				}
			}
		}
		if (dir && dir.childs && dir.childs.length) {
			$.each(dir.childs, function (c, k) {
				initDirective(k);
			});
		}
	}

	$doc.ready(function () {
			attachEl($doc);
			log.info('Directives controller has been started');
		}
	);

	exports.attachEl = attachEl;
	exports.detachEl = detachEl;
	exports.helpers = {
			'callChilds' : callChilds,
			'callParents' : callParents
		};
});



