/* global define */
define('reporter', function (require, exports, module) {
	var defaultDir = require('base.dir'),
		_ = require('lodash'),
		$ = require('$');

	module.exports = defaultDir.extend({
		initDir : function () {
			var rows = '',
				tpl = _.template($('#tbl-row').html()),
				self = this;

			$.ajax({
				url : './output.json',
				type : 'GET',
				dataType : 'json'
			}).success(function (data) {
				//debugger;
				_.forEach(data, function (file) {
					rows += tpl({
						filename : file.file,
						errors : file.error,
						warns : file.warn,
						infos : file.info
					});
				});
				self.$el.find('.js-tbody').append(rows);
			}).error(function () {
				//debugger;
			});
		}
	});
});



define('projects', function (require, exports, module) {
	var defaultDir = require('base.dir'),
		_ = require('lodash'),
		$ = require('$');

	module.exports = defaultDir.extend({
		initDir : function () {
			$.ajax({
				url : './projects.json',
				type : 'GET',
				dataType : 'json'
			}).success(function () {
				//debugger;
			}).error(function () {
				//debugger;
			});
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
				var tpl = _.template($('#t-project').html()),
					list = this.$el.find('.js-projectlist');

				dirs.detachEl(list);
				list.html(tpl({projectName: '', projectID : '', paths: ''}));
				list.find('.js-pr-name').removeAttr('disabled');
				dirs.attachEl(list);
				console.log(999);
			},
			showConfig : function () {
				var tpl = _.template($('#t-project').html()),
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
					list.html(pList);
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
		progress = require('progress-bar'),
		records = [],
		sortBy = '',
		totals,
		tpl = _.template($('#totals').html()),
		tplFiles = _.template($('#file-container').html()),
		file = _.template($('#file').html());

	module.exports = require('base.dir').extend({
		events : function () {
			this.ong('project.tab.click', 'onProjectClick');
			this.on('click', '.js-sortby .btn', 'onSortBy');
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
			elements = elements || records;
			$.each(elements, function (index, value) {
				fileHtml += file(value);
			});
			html += tplFiles({files : fileHtml, totals : tpl(totals)});
			this.$el.html(html);
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
