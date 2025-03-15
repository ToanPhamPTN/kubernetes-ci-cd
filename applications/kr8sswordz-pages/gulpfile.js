'use strict';

const gulp = require('gulp');
const del = require('del');
const webpack = require('webpack-stream');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass')(require('sass'));
const browserSync = require('browser-sync').create();
const connect = require('gulp-connect');
const historyApiFallback = require('connect-history-api-fallback');
const plumber = require('gulp-plumber');
const imageMin = require('gulp-imagemin');
const autoprefixer = require('autoprefixer');
const postcss = require('gulp-postcss');

const src = './src/';
const dist = './dist/';

gulp.task('clean:dist', () => {
  return del(dist);
});

gulp.task('compile:js', () => {
  return gulp.src(src + 'index.js')
    .pipe(plumber())
    .pipe(webpack(require('./webpack.config.js')))
    .pipe(gulp.dest(dist));
});

gulp.task('compile:sass', () => {
  return gulp.src(src + '**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dist));
});

gulp.task('copy:html', () => {
  return gulp.src(src + '**/*.html')
    .pipe(gulp.dest(dist));
});

gulp.task('copy:images', () => {
  return gulp.src([src + 'assets/**/*.jpg', src + 'assets/**/*.png'])
    .pipe(imageMin())
    .pipe(gulp.dest(dist + 'assets/'));
});

gulp.task('copy:assets', () => {
  return gulp.src([src + 'assets/**/*.*', '!' + src + 'assets/**/*.jpg', '!' + src + 'assets/**/*.png'])
    .pipe(gulp.dest(dist + 'assets/'));
});

gulp.task('watch:html', () => {
  gulp.watch(src + '**/*.html', gulp.series('copy:html'));
});

gulp.task('watch:sass', () => {
  gulp.watch([src + 'styles/**/*.scss', src + 'style.scss'], gulp.series('compile:sass'));
});

gulp.task('watch:js', () => {
  gulp.watch([src + '**/*.js', '!' + src + '**/*.test.js'], gulp.series('compile:js'));
});

gulp.task('build:dev', gulp.series(
  'clean:dist',
  gulp.parallel('compile:js', 'compile:sass', 'copy:html', 'copy:images', 'copy:assets')
));

gulp.task('serve:dev', gulp.series('build:dev', () => {
  browserSync.init({
    files: ['dist/**/*.js', 'dist/**/*.html', 'dist/**/*.css'],
    server: {
      baseDir: ['./dist/', './'],
      middleware: [historyApiFallback()]
    },
    logLevel: 'info',
    port: 3002
  });

  gulp.watch(src + '**/*.html', gulp.series('copy:html')).on('change', browserSync.reload);
  gulp.watch([src + 'styles/**/*.scss', src + 'style.scss'], gulp.series('compile:sass')).on('change', browserSync.reload);
  gulp.watch([src + '**/*.js', '!' + src + '**/*.test.js'], gulp.series('compile:js')).on('change', browserSync.reload);
}));

gulp.task('serve:prod', gulp.series('build:dev', () => {
  connect.server({
    root: ['./dist/', './'],
    port: 3002,
    host: '0.0.0.0',
    livereload: false,
    middleware: (connect, opt) => {
      return [historyApiFallback()];
    }
  });
}));

gulp.task('default', gulp.series('serve:dev'));
