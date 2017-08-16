# im-ex
use ECMAScript2015 standard module to develop an app

### config
```javascript
module.exports = { // you can also export a function that returns a config object
  server: {
    root: './', // relative path to this config file, required
    host: '0.0.0.0', // server host, you can spec ip or "localhost", default: localhost
    port: 8080, // server port, default: 8080
    https: false,
    index: './public/index.html', // default ./index.html
    reload: 'hot', // true, false, 'hot', default: 'hot'
    headers: {}, // √
    historyFallback: true, // serve index.html to in place of 404
    open: true, // open browser, default: true   √
    // log: '', // 'page', 'console', where to show server error, default is 'console'
    setup(app) {  
      // app.get()  √
    },
    watch: './src',
  },
  entry: './src/index.js', // 暂时只支持一个entry文件
  resolve: {
    module: './node_modules',
    import: {
      react: {
        // if you omit export, then you can only use: import 'moduleName';
        // path must relative server.root and under it, or throw an error
        path: '~dist/react.js',
        export: 'React', // global namespace
      },
      'react-dom': {
        path: '~dist/react-dom.js',
        export: 'ReactDOM',
        // export may be a function, will receive a param as the file content
        // the return value will be treated as the es module content
        // so "export: 'ReactDOM'" is equal to 
        // export(code) { 
        //  return `(function(){\n${code};\n}).call(window);
        //   export default ReactDOM;` 
        // }
      },
      // when the value is a string, we think it is a standard es module, 
      // but we do not parse the import, just use it directly
      redux: '~es/index.js',
      'lodash-es': './node_modules/lodash-es/',
      // eg: import Header from 'comp/Header', will resolve ./src/components/Header
      // if it is a file, then use it, if it is a dir,
      // then use the ./src/components/Header/index.js(or jsx css ...)
      comp: './src/components/', // will resolve to relative to server.root starting with '/'
    },
    exts: [
      'js', 'jsx', 'css', 'scss', 'json' // default is ['js']
    ],
    res: {
      script: ['js', 'jsx', 'ts', 'coffee'],
      style: ['css', 'scss', 'sass', 'less', 'styl'],
      file: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'mp4', 'ogg', 'mp3'],
      raw: ['html', 'txt'],
      json: ['json', 'json5'],
    }
  },
  global: { // 可以定义全局变量
    // PACKAGE: require(path.resolve(process.cwd(), 'package.json')),
    process: {
      env: {
        NODE_ENV: 'development'
      }
    }, // default
    __DEV__: true,
  },
  head: { // 可以配置head标签的一些内容
    title: 'create-react-app-imex',
    meta: {},
    favicon: './public/favicon.ico',
    scripts: [],
    styles: []
  },
  // loader: {
  //   vue: require('vue-es6-transform')
  // }
}
```