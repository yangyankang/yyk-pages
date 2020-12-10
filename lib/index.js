const { src, dest, parallel, series, watch } = require('gulp')

// 删除目录
const del = require('del')

// 热更新
const browserSync = require('browser-sync')

// 加载所有gulp的插件
const loadPlugins = require('gulp-load-plugins')
const { stream } = require('browser-sync')
const plugins = loadPlugins()

const bs = browserSync.create()
// const sass = require('gulp-sass')
// const babel = require('gulp-babel')
// const swig = require('gulp-swig')
// const imagemin = require('gulp-imagemin')



const data = {
  menus: [
    {
      name: 'Home',
      icon: 'aperture',
      link: 'index.html'
    },
    {
      name: 'Features',
      link: 'features.html'
    },
    {
      name: 'About',
      link: 'about.html'
    },
    {
      name: 'Contact',
      link: '#',
      children: [
        {
          name: 'Twitter',
          link: 'https://twitter.com/w_zce'
        },
        {
          name: 'About',
          link: 'https://weibo.com/zceme'
        },
        {
          name: 'divider'
        },
        {
          name: 'About',
          link: 'https://github.com/zce'
        }
      ]
    }
  ],
  pkg: require('./package.json'),
  date: new Date()
}

// 清除任务
const clean = () => {
  return del(['dist', 'temp'])
}

// 样式的编译任务
const style = () => {
  return src('src/assets/styles/*.scss', { base: 'src' })
    .pipe(plugins.sass({
      outputStyle: 'expanded'
    }))
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }))
}

// 编译js
const script = () => {
  return src('src/assets/scripts/*.js', { base: 'src' })
    .pipe(plugins.babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }))
}



// 编译模板html
const page = () => {
  return src('src/*.html', { base: 'src' })
    .pipe(plugins.swig({ data }))
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }))
}


// 图片转换
const image = () => {
  return src('src/assets/images/**', { base: 'src' })
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

// 字体转换
const font = () => {
  return src('src/assets/fonts/**', { base: 'src' })
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

// 拷贝额外的路径
const extra = () => {
  return src('public/**', { base: 'public' })
    .pipe(dest('dist'))
}

const serve = () => {
  watch('src/assets/styles/*.scss', style)
  watch('src/assets/scripts/*.js', script)
  watch('src/*.html', page)
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', extra)
  watch(['src/assets/images/**', 'src/assets/fonts/**', 'public/**'], bs.reload)

  bs.init({
    notify: false,
    port: 2000,
    // files: ['dist/**'], // 监听dist下的目录就刷新
    server: {
      // open: true,
      baseDir: ['temp', 'src', 'public'],
      // 发起请求会先找routes里面的
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

// 文件引用关系 对构建注释进行转换
const useref = () => {
  return src('dist/*.html', { base: 'dist' })
    .pipe(plugins.useref({ searchPath: ['dist', '.'] }))
    // 产生html 、 css 、js文件流
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({ collapseWhitespace: true, minifyCss: true, minifyJs: true })))
    .pipe(dest('release'))
}

// 组合任务并行
const compile = parallel(style, script, page)

// 串行任务 上线之前的任务
const build = series(
  clean,
  parallel(
    series(compile, useref),
    image,
    font,
    extra)
)

const develop = series(compile, serve)

module.exports = {
  clean,
  build,
  develop,
}
