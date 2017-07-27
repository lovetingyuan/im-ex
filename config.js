const path = require('path')

module.exports = {
  server: {
    root: './',
    port: 8080,
    host: '127.0.0.1',
    index: 'index.html',
    watch: ['./src/**/*.js', './src/**/*.css', './src/**/*.scss'], // 默认会加入index字段并刷新浏览器
  },
  entry: './src/app.js', // 暂时只支持一个entry文件
  resolve: {
    import: { // 如果在这里配置，需要等待客户端加载js完成之后返回export的值
      react: {
        path: '/node_modules/react/dist/react.js',
        export: 'React'
      },
      'react-dom': {
        path: '/node_modules/react-dom/dist/react-dom.js',
        export: 'ReactDOM'
      },
      'mobx-react': {
        
      }
    }, // 如果没有配置，对于第三方库会去依次检查package.json中的module和jsnext:main，
    //如果没有则尝试加载browser or main, 如果加载main很有可能会报错，此时需要用户去自行构建
    extensions: [
      'js', 'css', 'html', 'jsx', 'ts', 'sass', 'scss', 'less', 'json'
    ]
  },
  global: { // 可以定义全局变量
    PACKAGE: require(path.resolve(process.cwd(), 'package.json'))
  },
  head: { // 可以配置head标签的一些内容
    title: 'lalala', meta: {}, favicon: '', scripts: [], styles: []
  }
}