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
					console.log('1');
					rows += tpl({
						filename : file.file,
						errors : file.error,
						warns : file.warn,
						infos : file.info
					});
				})
				self.$el.find('.js-tbody').append(rows);
			}).error(function() {
				debugger;
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
