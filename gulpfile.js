var gulp = require('gulp');
var bower = require('gulp-bower');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var smodular = require('smodular/gulp');


gulp.task('bower', function() {
  return bower();
});


gulp.task('default', ['bower'], function () {
	var lib = require('bower-files')({
		overrides: {
    		jQuery: {
    			dependencies: {
    				'smodular' : "*"
    			}
    		},
    		lodash: {
    			dependencies: {
    				'smodular' : "*"
    			}
    		}
    	}
	});
	gulp.src(lib.js)
        .pipe(smodular())
		.pipe(sourcemaps.init())
    	.pipe(concat('libs.min.js'))
    	.pipe(uglify())
    	.pipe(sourcemaps.write('.'))
    	.pipe(gulp.dest('public/static/dist/js'));
});
