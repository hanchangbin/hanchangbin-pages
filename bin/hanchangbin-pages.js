#!/usr/bin/env node
//bin/hanchangbin-pages.js文件作为我们的一个cli入口,它需要有一个声明的注释,就是上面这个,这个时候就会作为一个cli入口出现

//我们在命令行中传递的参数可以通过process.argv拿到,argv是一个数组
// console.log(process.argv)
process.argv.push('--cwd')
process.argv.push(process.cwd())//添加 项目当前所在的目录
process.argv.push('--gulpfile')
// process.argv.push(require.resolve('../lib/hanchangbin-pages.js'))
//require.resolve方法是找到这个模块所对应的路径,里面传递的参数时通过相对路径去传
//使用..会直接去package找main字段找到对应的路径
process.argv.push(require.resolve('..'))


// 使用require获取gulp后我们在执行hanchangbin-pages时就 执行了gulp命令
require('gulp/bin/gulp')