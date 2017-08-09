function page() { // script injected to page
  /* injected by im-ex, using global namespace: __NAMESPACE__ */
  'use strict';
  if (typeof global !== 'object') {
    win.global = win
  }
  win.__NAMESPACE__ = {
    setStyle(content, filePath) {
      let style = document.createElement('style')
      style.appendChild(document.createTextNode(content))
      document.head.appendChild(style)
      style = null
    }
  }
  const es = new EventSource('__SSE__')
  function reload() {
    const entryScript = document.querySelectorAll('script[data-type=entry]')
    entryScript.forEach(dom => {
      const src = dom.getAttribute('src')
      let script = document.createElement('script')
      script.setAttribute('type', 'module');
      script.setAttribute('src', src + '&_t=' + Date.now());
      document.head.appendChild(script)
      script.onload = function () {
        document.head.removeChild(script)
        script = script.onload = null
      }
    })
  }
  es.onmessage = function (e) {
    const data = JSON.parse(e.data)
    if (data.type === 'hotreload') {
      reload()
    } else if (data.type === 'reload') {
      location.reload()
    }
  }

}

module.exports = function() {
  let pageStr = page.toString()
    .replace(/__NAMESPACE__/g, config._browserNameSpace)
    .replace(/__SSE__/g, config._sse)
  return `
    ;(function(win, doc) { 
      ${pageStr.substring(pageStr.indexOf('{') + 1, pageStr.lastIndexOf('}'))} 
    })(window, document);
  `
}
