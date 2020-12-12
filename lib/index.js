// 实现这个项目的构建任务
const { src, dest, parallel, series, watch } = require('gulp')

const del = require('del')
const browserSync = require('browser-sync')
let bs = browserSync.create()

const plugins = require('gulp-load-plugins')()

const cwd = process.cwd()

let config = {
  // deaflut config
  build: {
    src: 'src',
    dist:'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles:'assets/styles/**',
      scripts: 'assets/scripts/**',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**'
    }
  }
}

try {
 let  loadConfig = require(`${cwd}/pages.config.js`)
 config = Object.assign({}, config, loadConfig)
} catch (e) {

}


const clean = () => {
  return del([ config.build.dist, config.build.temp])
}

const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.sass({
      outputStyle: 'compressed'
    }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true}))
}

const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.babel({
      presets: [require('@babel/preset-env')]
    }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true}))
}

const page = () => {
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.data(config))
    .pipe(plugins.swig({ defaults: { cache: false } })) // Avoid caching when watching/compiling html templates with BrowserSync, etc.
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true}))
}

const image = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}


const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}


const serve = () => {
  watch(config.build.paths.styles, { cwd: config.build.src}, style)
  watch(config.build.paths.scripts, { cwd: config.build.src}, script)
  watch(config.build.paths.pages, { cwd: config.build.src}, page)

  watch([
    config.build.paths.images,
    config.build.paths.fonts,

  ], { cwd: config.build.src }, bs.reload)

  watch('**', {cwd: config.build.public}, bs.reload)
  bs.init({
    notify: false,
    port: 2080,
    server: {
      baseDir: [config.build.dist],
      routes: {
        '/node_modules': 'node_modules'
      }
    },
  })
}


const useref = ()=> {
  return src('**', { base: config.build.temp, cwd: config.build.temp})
  .pipe(plugins.useref({
    searchPath: [config.build.temp, '.']
  }))
  .pipe(plugins.if(/\.js$/, plugins.uglify()))
  .pipe(plugins.if(/\.js$/, plugins.cleanCss()))
  .pipe(plugins.if(/\.html$/, plugins.htmlmin({
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true
  })))
  .pipe(dest(config.build.dist))
}
const compile = parallel(style, script, page)

const build = series(clean, parallel(series(compile, useref), image, font, extra))

const start = series(compile, serve)

module.exports = {
  clean,
  build,
  start
}
