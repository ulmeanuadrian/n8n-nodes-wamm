'use strict';

const gulp = require('gulp');
const { iconfont } = require('@fancy-components/gulp-iconfont');

const ICONS_SRC = 'nodes/**/icons/*.svg';
const ICONS_DEST = 'dist/nodes';

gulp.task('build:icons', function() {
  return gulp.src(ICONS_SRC, { allowEmpty: true })
    .pipe(iconfont({
      fontName: 'n8n-nodes',
      path: 'src/icon-template.css',
      targetPath: '../../css/n8n-nodes-icon-font.css',
      fontPath: '../../fonts/',
    }))
    .pipe(gulp.dest(ICONS_DEST));
});
