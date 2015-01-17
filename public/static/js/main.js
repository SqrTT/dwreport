/* global define */

define('paginator', function (require, exports, module) {
	var defaultDir = require('base.dir'),
		_ = require('lodash'),
		templater = require('templater'),
		$ = require('$');

	module.exports = defaultDir.extend({
		initDir : function () {
			var self = this;
			if (self._super) {
				self._super.call(arguments);
			}
			self.totalRows = 0;
			self.pageSize = 0;
			self.currentPage = 1;
		},
		showContentPage : function (data) {
			var self = this,
				content = '';
			$.each(_.first(data.rows, data.pageSize || 100), function (index, value) {
				content += templater(data.template)(value);
			});

			self.$el.html(content);

		}
	});
});


define('project', function (require, exports, module) {

	module.exports = require('base.dir').extend({
		initDir : function () {
			console.log(3);
		},
		events : function () {
			this.on('click', 'button', 'saveProject');
		},
		saveProject : function () {
			var vals = this.callChilds('getInput');
			require('$').ajax({
				type : 'POST',
				url : '/project',
				data : JSON.stringify(vals),
				contentType : 'application/json; charset=utf-8',
				dataType : 'json'
			});
		}
	});
});

define('config-dir', function (require, exports, module) {
	var defaultDir = require('base.dir'),
		dirs = require('dirs'),
		_ = require('lodash'),
		modaldialog = require('modaldialog'),
		templater = require('templater'),
		$ = require('$'),

			configDir = defaultDir.extend({
			initDir : function () {
			},
			events : function () {
				if (this._super) {
					this._super();
				}
				this.on('click', '.js-config', 'showConfig');
				this.on('click', '.js-addnew', 'addNew');
			},
			addNew : function () {
				var tpl = templater('t-project'),
					list = this.$el.find('.js-projectlist');

				dirs.detachEl(list);
				list.html(tpl({projectName: '', projectID : '', paths: ''}));
				list.find('.js-pr-name').removeAttr('disabled');
				dirs.attachEl(list);
			},
			showConfig : function () {
				var tpl = templater('t-project'),
					pList = '',
					list = this.$el.find('.js-projectlist');

				$.ajax({
					url : './projects.json',
					type : 'GET',
					dataType : 'json'
				}).success(function (data) {
					dirs.detachEl(list);
					_.each(data, function (prj) {
						pList += tpl(prj);
					});
					list.show();
					pList += '<button class="btn js-addnew">Add new</button>';
					modaldialog.show(pList);
					dirs.attachEl(list);
				}).error(function () {
					list.html('error happend!');
				});
			}
		});
	module.exports = configDir;
});

define('projects-tab', function (require, exports, module) {
	var $ = require('$'),
		gevent = require('gevent'),
		_ = require('lodash');

	module.exports = require('base.dir').extend({
		events : function () {
			this.on('click', '.js-tab', 'onTabClick');
		},
		onTabClick : function (event) {
			gevent.trigger('project.tab.click', event);
		},
		initDir : function () {
			var self = this,
				tpl = _.template($('#t-project-tab').html());

			$.ajax({
				url : './projects.json',
				type : 'GET',
				dataType : 'json'
			}).success(function (data) {
				$.each(data, function (index, prj) {
					self.$el.append(tpl(prj));
				});
			});
		}
	});
});

define('project-view', function (require, exports, module) {
	var $ = require('$'),
		_ = require('lodash'),
		templater = require('templater'),
		progress = require('progress-bar'),
		dirs = require('dirs'),
		records = [],
		sortBy = '',
		totals,
		tpl = templater('totals'),
		tplFiles = templater('file-container');

	module.exports = require('base.dir').extend({
		initDir : function () {
			var self = this;
			if (self._super) {
				self._super();
			}
		},

		events : function () {
			this.ong('project.tab.click', 'onProjectClick');
			this.on('click', '.js-sortby .btn', 'onSortBy');
			this.on('click', '.js-detail', 'onDetail');
		},
		onDetail : function (event) {
			var $elem = $(event.target);
			this.showDetail($elem.data('fileid'), $elem.data('type'));
 		},
 		showDetail : function (fileid, type) {
 			require('detailsmodal').show(fileid, _.find(records, {filename: fileid})[type]);
 		},
		onSortBy : function (event) {
			var sortedArr;

			sortBy = $(event.target).data('sortby');
			sortedArr = _.sortBy(records, function (value) {
				switch (sortBy) {
					case 'errors':
						return -value.error.length;
					case 'warns':
						return -value.warn.length;
					case 'infos':
						return -value.info.length;
					case 'functs':
						return -value.functionCount;
					case 'sumcomp' :
						return -value.complexity.sum;
					case 'avgcomp' :
						return -value.complexity.avg;
					case 'medcomp' :
						return -value.complexity.mediana;
					case 'maxcomp' :
						return -value.complexity.max;
					case 'mincomp' :
						return -value.complexity.min;
					case 'sumstat' :
						return -value.statements.sum;
					case 'avgstat' :
						return -value.statements.avg;
					case 'medstat' :
						return -value.statements.mediana;
					case 'maxstat' :
						return -value.statements.max;
					case 'minstat' :
						return -value.statements.min;
					case 'sloc' :
						return -value.sloc.source;
					case 'loc' :
						return -value.sloc.total;
					case 'comments' :
						return -value.sloc.comment;
					case 'empty' :
						return -value.sloc.empty;
					default:
						return 0;
				}
			});

			//debugger;
			this.drawView(sortedArr);
		},
		drawView : function (elements) {
			var html = '',
				fileHtml = '';

			html += tplFiles({totals : tpl(totals)});
			dirs.detachTree(this.$el);
			this.$el.html(html);
			dirs.attachTree(this.$el);
			this.callChilds('showContentPage', {
				rows : elements || records,
				template: 'file',
				pageSize: 50
			});
		},
		onProjectClick : function (event) {
			var $target = $(event.target),
				self = this;
			//debugger;
			progress.show();
			$.ajax({
				url : '/output/' + $target.data('id'),
				type : 'GET',
				dataType : 'json'
			}).success(function (data) {
				if (data.success) {
					totals = data.data.total;
					delete data.data.total;
					$.each(data.data, function (index, value) {
						value.filename = index;
						records.push(value);
					});
					self.drawView();
				} else {
					require('console').error(data);
				}
			}).always(function () {
				progress.hide();
			});
		}
	});
});

define('detailsmodal', function (require, exports) {
	var _ = require('lodash'),
		templater = require('templater'),
		modal = require('modaldialog');

	exports.show = function (filename, data) {
		var html = _.reduce(data, function (result, value) {
			value.evidence = value.evidence || '';
			result += templater('detailsmodal-row', value);
			return result;
		}, '');
		modal.show(templater('detailsmodal-container', {filename: filename, rows : html}));

	}
});

define('progress-bar', function (require, exports) {
	var count = 0,
		Spin = require('spin'),

	opts = {
		lines: 12, // The number of lines to draw
		length: 30, // The length of each line
		width: 4, // The line thickness
		radius: 20, // The radius of the inner circle
		corners: 0.2, // Corner roundness (0..1)
		rotate: 0, // The rotation offset
		direction: 1, // 1: clockwise, -1: counterclockwise
		color: '#476172', // #rgb or #rrggbb or array of colors
		speed: 1.6, // Rounds per second
		trail: 53, // Afterglow percentage
		shadow: false, // Whether to render a shadow
		hwaccel: true, // Whether to use hardware acceleration
		className: 'spinner', // The CSS class to assign to the spinner
		zIndex: 2e9, // The z-index (defaults to 2000000000)
		position: 'fixed',
		top: '50%', // Top position relative to parent
		left: '50%' // Left position relative to parent
	},
	spinner = new Spin(opts);

	exports.show = function () {
		if (count < 1) {
			spinner.spin(require('document').body);
		}
		count++;
	};
	exports.hide = function () {
		count--;
		if (count < 1) {
			spinner.stop();
			count = 0;
		}
	};
});
define("templater", function(require, exports, module) {
	var cache = {},
		log = require('log'),
		_ = require('lodash'),
		curTpl;

	module.exports = function(id, data) {

		while (!cache[id]) {
			curTpl = document.getElementById(id);
			if (!curTpl) {
				log.error("Can't find template : " + id);
				return;
			}
			cache[id] = _.template(curTpl.innerHTML + "");
		}

		if (data) {
			return cache[id](data);
		}

		return cache[id];
	}
})

define("modaldialog", function (require, exports, module) {
	"use strict";
	var templater = require('templater'),
		dirs = require('dirs'),
		$ = require('$'),
		$body = $(templater("modaldialog-tml", {content : ""})),
		fadeTime = 200,
		prefix = ".ng-modal-",
		BODY = $("body"),
		CLICK = "click",
		$content = $body.find(prefix + "dialog-content"),
		dialog;

	$body.hide();

	BODY.append($body);

	BODY.on(CLICK, prefix + "overlay", function () {
		dialog.hideAll();
	});
	BODY.on(CLICK, prefix + "close", function () {
		dialog.hideAll();
	});

	$(document).on("dialog.updatesize", function () {
		$content.height("auto");
		$content.width("auto");
	}).keyup(function(e) {
		if (e.keyCode == 27) {
			dialog.hideAll();
		}   // esc
	});

	dialog = {
		hideAll : function () {
			$(prefix + "admin").stop().fadeOut(fadeTime, function () {
				$body.hide();
				dirs.detachTree($content);
			});
		},
		show : function (content, noResize) {
			

			$content.html($(content));

			dirs.attachTree($content);
			$body.stop().fadeIn(fadeTime);
		}
	};
	return dialog;
});