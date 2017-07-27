module.exports = function sw() {
  importScripts('/node_modules/babel-standalone/babel.js');
  importScripts('/node_modules/sass.js/dist/sass.worker.js');
  // importScripts('/node_modules/less/dist/less.js');

  const getFileType = fileName => fileName.split('.').pop()

  const transformCode = {
    jsx(source) {
      return Promise.resolve(Babel.transform(source, {
        presets: ['react'],
        sourceMaps: 'inline'
      }).code)
    },
    sass(source) {
      return new Promise((resolve, reject) => {
        Sass.compile(source, {
          sourceMapFile: true
        }, result => {
          resolve(`setStyle(\`${result.text}\`);`)
        })
      })
    },
    // less(source) {
    //   return less.render(source, {sourceMap: {sourceMapFileInline: true}})
    // }
  }
  transformCode.scss = transformCode.sass

  function sendMsgToClient(client, msg) {
    return new Promise(function (resolve, reject) {
      const msgChan = new MessageChannel();
      msgChan.port1.onmessage = function (event) {
        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data);
        }
      };
      client.postMessage(msg, [msgChan.port2]);
    });
  }

  self.addEventListener('install', function (e) {
    console.log('installing')
    self.skipWaiting()
    e.waitUntil(() => {
      return caches.open(CACHE.name).then(cache => cache.addAll(Object.keys(CACHE.list)))
    })
  })

  self.addEventListener('activate', function (e) {
    console.log('activiting')
    e.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(cacheNames.map(cacheName => {
          if (cacheName !== CACHE.name) {
            return caches.delete(cacheName)
          }
        })).then(() => {
          console.log('activated')
        })
      })
    )
  })
  self.addEventListener('fetch', function (e) {
    const { request } = e;
    console.log('fetching: ' + request.url)
    e.respondWith(caches.match(request).then(function (response) {
      return response || fetch(request).then(function (response) {
        const url = new URL(response.url)
        if (url.pathname in CACHE.list) {
          const fileType = getFileType(url.pathname)
          if (fileType in transformCode) {
            return Promise.all([response.text(), {
              fileType,
              request,
              response,
            }])
          }
          return caches.open(CACHE.name)
            .then(cache => cache.put(request, response.clone()))
            .then(() => response)
        }
        return response;
      }).then(result => {
        if (Array.isArray(result)) {
          const [
            responseText, {
            fileType, request, response
          }
          ] = result

          let res = transformCode[fileType](responseText)
          const init = {
            status: response.status,
            statusText: response.statusText,
            headers: { 'Content-Type': 'application/javascript; charset=UTF-8' }
          }
          response.headers.forEach((v, k) => {
            init.headers[k] = v;
          })
          return Promise.all([res, init, request])
        } else {
          return result
        }
      }).then(result => {
        if (Array.isArray(result)) {
          const [
            transformedJS, init, request
          ] = result
          const newResponse = new Response(transformedJS, init)
          return caches.open(CACHE.name)
            .then(cache => cache.put(request, newResponse.clone()))
            .then(() => newResponse);
        } else {
          return result;
        }
      });
    }))
  })

  self.addEventListener('push', function (e) {

  })
}