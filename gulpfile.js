var gulp = require('gulp');
var minifycss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var htmlclean = require('gulp-htmlclean');

var root = './public';
var buildDir = root;
var datas = {
    js: [root + '/**/*.js'],
    css:[root + '/**/*.css'],
    html:[root + '/**/*.html']
}
// css
gulp.task('minify-css', function() {
    return gulp.src(datas.css)
        .pipe(minifycss())
        .pipe(gulp.dest(buildDir));
});

// html
gulp.task('minify-html', function() {
    return gulp.src(datas.html)
        .pipe(htmlclean())
        .pipe(htmlmin({
            removeComments: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
        }))
        .pipe(gulp.dest(buildDir))
});
// js
gulp.task('minify-js', function() {
    return gulp.src(datas.js)
        .pipe(uglify())
        .pipe(gulp.dest(buildDir));
});
// run
gulp.task('default', ['minify-html','minify-css','minify-js']);
