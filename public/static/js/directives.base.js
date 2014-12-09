/* global define */
define('Class', function (require, exports, module) {
/**
 * Inspired by base2 and Prototype
 *
 * This script provides inheritance support
 *
 * The constructor is named 'init()'
 *
 * If a needs to override a method of a superclass, the overridden method can always be
 * called using
 *                   this._super();
 *
 * This is true for the constructor as well as for any other method.
 *
 * see http://etobi.de/blog/artikel/weiterlesen/vererbung-mit-javascript/
 */
	function Class() {}

	(function () {
		var initializing = false,
			fnTest = /xyz/.test(function () {xyz; }) ? /\b_super\b/ : /.*/;

		// The base Class implementation (does nothing)
		//this.Class = function(){};

		// Create a new Class that inherits from this class
		Class.extend = function extend(prop) {
			var _super = this.prototype, name, prototype;

			// Instantiate a base class (but only create the instance,
			// don't run the init constructor)
			initializing = true;
			prototype = new this();
			initializing = false;

			// Copy the properties over onto the new prototype
			for (name in prop) {
				// Check if we're overwriting an existing function
				prototype[name] =
					typeof prop[name] === 'function' &&
					typeof _super[name] === 'function' &&
					fnTest.test(prop[name]) ?
					(function (name, fn) {
						return function () {
							var tmp = this._super, ret;

							// Add a new ._super() method that is the same method
							// but on the super-class
							this._super = _super[name];

							// The method only need to be bound temporarily, so we
							// remove it when we're done executing
							ret = fn.apply(this, arguments);
							this._super = tmp;

							return ret;
						};
					})(name, prop[name])
					:
					prop[name];
			}

			// The dummy class constructor
			function Class() {
				// All construction is actually done in the init method
				if (!initializing && this.init) {
					this.init.apply(this, arguments);
				}
			}

			// Populate our constructed prototype object
			Class.prototype = prototype;

			// Enforce the constructor to be what we expect
			Class.constructor = Class;

			// And make this class extendable
			Class.extend = extend;

			return Class;
		};
	})();
	module.exports = Class;
});


define('base.dir', function (require, exports, module) {
	var helper = require('dir.helper'),
		gevent = require('gevent'),
		uniqueID = 0;

	module.exports = require('Class').extend({
		on : function (event, classes, fnName) {
			var self = this;
			if (!fnName) {
				self.$el.on(event, self[classes].bind(self));
			} else {
				self.$el.on(event, classes, self[fnName].bind(self));
			}
		},
		ong : function (event, classes, fnName) {
			var self = this;

			if (!fnName) {
				gevent.on(event, function (doc, event) {
					self[classes].call(self, event);
				});
			} else {
				gevent.on(event, classes, function (doc, event) {
					self[fnName].call(self, event);
				});
			}
		},
		callParents : function (fnName, data, deep) {
			return helper.callParents(this.$el, fnName, data, deep);
		},
		callChilds : function (fnName, data, deep) {
			return helper.callChilds(this.$el, fnName, data, deep);
		},
		destroy : function () {
			this.$el.off();
		},
		init : function ($el, options) {
			this.$el = $el;
			this.type = options.dir;
			this.options = options;
			this._id = uniqueID++;
			$el.addClass('d-' + options.dir);
		}
	});
});

define('input', function (require, exports, module) {
	var defaultDir = require('base.dir'),
		durtyClass = 'durty',
		validClass = 'valid';

	module.exports = defaultDir.extend({
		init : function ($el, options) {
			var self = this;
			self._super && self._super($el, options);
			self.initValue = self.getValue();
		},
		events : function () {
			this.on('change', 'updateDurty');
		},
		isDurty : function () {
			return this.initValue !== this.getValue();
		},
		updateDurty : function () {
			var self = this;
			if (self.isDurty()) {
				self.$el.addClass(self.options.durtyClass || durtyClass);
			} else {
				self.$el.removeClass(self.options.durtyClass || durtyClass);
			}
		},
		getValue : function () {
			return this.$el.val();
		},
		setValue : function (val) {
			this.$el.val(val);
			this.updateDurty();
		},
		isValid : function () {
			return true;// TODO: implement validation for inputs
		},
		validate : function () {
			var self = this,
				valid = self.isValid();
			if (valid) {
				self.$el.addClass(self.options.validClass || validClass);
			} else {
				self.$el.removeClass(self.options.validClass || validClass);
			}
			return valid;
		},
		getInput : function () {
			var self = this;
			return {
				'value' : self.getValue(),
				'valid' : self.isValid(),
				'name' : self.$el.prop('name')
			};
		},
		setInput : function (data) {
			if (data && data.value) {
				this.setValue(data.value);
			}
		}
	});
});
