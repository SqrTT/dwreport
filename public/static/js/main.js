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

define('reporter-warn', function (require, exports, module) {
	var defaultDir = require('base.dir'),
		_ = require('lodash'),
		$ = require('$');

	module.exports = defaultDir.extend({

	});
});

define('reporter-error', function (require, exports, module) {
	var defaultDir = require('base.dir'),
		_ = require('lodash'),
		$ = require('$');

	module.exports = defaultDir.extend({

	});
});

define('reporter-info', function (require, exports, module) {
	var defaultDir = require('base.dir'),
		_ = require('lodash'),
		$ = require('$');

	module.exports = defaultDir.extend({

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
			}).success(function (data) {
				//debugger;
			}).error(function () {
				//debugger;
			});
		}
	});
});

define('project', function (require, exports, module) {
	var $ = require('$');

	module.exports = require('base.dir').extend({
		initDir : function () {
			console.log(3);
		},
		events : function () {
			this.on('click', 'button', 'saveProject');
		},
		saveProject : function () {
			var vals = this.callChilds('getInput');
			$.ajax({
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
		gevent = require('ebus');

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
	var $ = require("$");

	module.exports = require('base.dir').extend({
		events : function () {
			this.ong('project.tab.click', 'onProjectClick');
		},
		onProjectClick : function (event) {
			var $target = $(event.target);
			//debugger;
			$.ajax({
				url : '/output/' + $target.data('id'),
				type : 'GET',
				dataType : 'json'
			}).success(function (data) {
				if (data.success) {
					debugger;
				} else {
					require('log').error(data);
				}
			});
		}
	});
});
