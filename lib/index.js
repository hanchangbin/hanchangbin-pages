const { src , dest ,parallel ,series ,watch ,} = require('gulp')

const del = require('del')
const loadPlugins = require('gulp-load-plugins')
const browserSync = require('browser-sync')



const pulgins = loadPlugins()//自动加载插件
//browserSync提供了一个create方法用于创建服务器
const bs = browserSync.create()
// data在项目中的pages.config.js文件中,如何获取项目当中的data?
// 1.定义变量cwd,process.cwd()方法会返回当前命令行所在的工作目录,假如这个模块在dome1项目中运行,那么工作目录就是dome1目录
const cwd = process.cwd()
//2.载入配置文件
let config ={
  //default,假设存在默认成员就不能直接替换config,需要通过Object.assign去拷贝对象
  // 配置默认的抽象路径
  build:{
    src:'src',
    temp:'temp',
    dist:'dist',
    public:'public',
    paths:{
      styles:'assets/styles/*.scss',
      scripts:'assets/scripts/*.js',
      pages:'*.html',
      images:'assets/images/**',
      fonts:'assets/fonts/**',
    }
  }
}

try {//因为require一个不存在的地址会报错所以我们用try_catch包装一下
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({ },config,loadConfig)
} catch (error) {
  console.log(error)
}

const clean = ()=>{
  return del([config.build.dist,config.build.temp])//返回的Promise,我们可以去标记这个任务完成
}

const style = ()=>{
  return src(config.build.paths.styles,{base:config.build.src,cwd:config.build.src})
  .pipe(pulgins.sass({outputStyle:'expanded'}))
  .pipe(dest(config.build.temp))
  .pipe(bs.reload({stream:true}))
}


const script = ()=>{
  return src(config.build.paths.scripts,{base:config.build.src,cwd:config.build.src})
  .pipe(pulgins.babel({presets:[require('@babel/preset-env')]}))
  .pipe(dest(config.build.temp))
  .pipe(bs.reload({stream:true}))
}

const page = ()=>{
  return src(config.build.paths.pages,{base:config.build.src,cwd:config.build.src})
  .pipe(pulgins.swig({data:config.data}))
  .pipe(dest(config.build.temp))
  .pipe(bs.reload({stream:true}))
}

const image = ()=>{
  return src(config.build.paths.images,{base:config.build.src,cwd:config.build.src})
  .pipe(pulgins.imagemin())
  .pipe(dest(config.build.dist))
}
const font = ()=>{
 
  return src(config.build.paths.fonts,{base:config.build.src,cwd:config.build.src})
  .pipe(pulgins.imagemin())
  .pipe(dest(config.build.dist))
}

// 其他文件的拷贝
const extra = ()=>{
   // 匹配pulbic下的所有文件
  return src('**',{base:config.build.public,cwd:config.build.public})
  .pipe(dest(config.build.dist))
}
// 将开发服务器单独定义到一个任务中启动
const serve = () =>{
  watch(config.build.page.styles,{cwd:config.build.src},style)
  watch(config.build.page.scripts,{cwd:config.build.src},script)
  watch(config.build.page.pages,{cwd:config.build.src},page)
  //上面的文件编译时有意义的,下面的文件在开发时编译开销会很大,不需要编译
  // watch('src/assets/images/**',image)
  // watch('src/assets/fonts/**',font)
  // watch('public/**',extra)
  //开发环境image,font,extra等文件都从src去获取,不需要再在dist中获取可以节省开销,
  //下面是监听src下面的image,font,extra等文件的变化,在其发生改变时重新渲染到浏览器
  // watch([
  //   'src/assets/images/**',
  //   'src/assets/scripts/*.js',
  //   'src/*.html'
  // ],bs.reload)//这里的reload也可以理解为一个任务
  watch([
    config.build.paths.images,
    config.build.paths.fonts
  ],{cwd:config.build.src},bs.reload)
  watch('**',{cwd:config.build.public},bs.reload)

  bs.init({
    notify:false,//打开浏览器网页通知
      port:2080,//端口号设定
      // // open:false,//是否自动打开浏览器
      // files:'dist/**',//监听当前目录下的文件变化以更新浏览器
    server:{
      baseDir:[config.build.temp,config.build.src,config.build.public],//目录路径定义成数组,按顺序去找,第一个没有就在下一个找,由于dist和src中的图片和文件没啥区别,可以在src寻找,public也是如此,这样可以提高效率
      //对于特殊路径的文件给定特殊的路由,把node_modules下的文件都指定到相应的目录中去,
      routes:{//routes优先于baseDir,如果存在就会先执行routes
        '/node_modules':'node_modules'
      },
      
    }
  })
}
// 上线前打包node_modules等相关依赖文件 的处理
const useref = ()=>{
  return src(config.build.paths.pages,{base:config.build.temp,cwd:config.build.temp})
  .pipe(pulgins.useref({searchPath:[config.build.temp , '.']}))//dist文件目录下的文件,.当前文件目录下的依赖文件
  .pipe(pulgins.if(/\.js$/,pulgins.uglify()))
  .pipe(pulgins.if(/\.css$/,pulgins.cleanCss()))
  .pipe(pulgins.if(/\.html/,pulgins.htmlmin({
    collapseWhitespace:true,
    minifyCSS:true,
    minifyJS:true
  })))//属性collapseWhitespace用来压缩HTML的空白字符和换行符minifyCSS:true,minifyJS:true这两个属性会把HTML中的css和js压缩掉
  .pipe(dest(config.build.dist))
}
//并行任务--子任务
const compile = parallel(style,script,page); 
// 上线前编译
const build = series(clean,parallel(series(compile,useref),image,font,extra))
// 开发时编译
const develop = series(compile,serve)
//运行develop时打包出来的dist文件时没有image,font和public目录的,但是这并不影响项目在浏览器的渲染,相关文件的获取是直接从src源码中获取的,其实就是以一个最小的代码把我们的服务器跑起来了
module.exports = {
  clean,
  build,
  develop,
}