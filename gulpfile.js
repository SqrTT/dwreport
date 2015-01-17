var gulp = require('gulp');
var bower = require('gulp-bower');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var sourcemaps = require('gulp-sourcemaps');
var smodular = require('smodular/gulp');


var publicDir = 'public/static/';
var src = {
  css: [publicDir +'css/**/*.css'],
  js: [publicDir + 'js/**/*.js']
}

var dist = {
  css: publicDir + 'dist/css/',
  js: publicDir + 'dist/js'
}
gulp.task('bower', function () {
	return bower();
});

gulp.task('libs', ['bower'], function() {
	bower();
	var lib = require('bower-files')({
	overrides: {
    		jquery: {
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

	gulp.src(lib.css)
		.pipe(sourcemaps.init())
    	.pipe(concat('libs.min.css'))
    //	.pipe(minifyCSS())
    	.pipe(sourcemaps.write('.'))
    	.pipe(gulp.dest(dist.css));

   	gulp.src(lib.js)
        .pipe(smodular())
		.pipe(sourcemaps.init())
    	.pipe(concat('libs.min.js'))
    //.pipe(uglify())
    	.pipe(sourcemaps.write('.'))
    	.pipe(gulp.dest(dist.js));
});


gulp.task('default', ['libs'], function () {

});
