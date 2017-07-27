function page() {
  'use strict';
  if (typeof global !== 'object') {
    win.global = win
  }
  win.__TY__ = {
    setStyle(content) {
      let style = document.createElement('style')
      style.appendChild(document.createTextNode(content))
      document.head.appendChild(style)
      style = null
    }
  }
  const es = new EventSource('/sse')
  function reload() {
    let script = document.createElement('script')
    script.setAttribute('type', 'module');
    script.setAttribute('src', 'src/app.js?_t=' + Date.now());
    document.head.appendChild(script)
    script.onload = function () {
      document.head.removeChild(script)
      script = script.onload = null
    }
  }
  es.onmessage = function (e) {
    const data = JSON.parse(e.data)
    if (data.type === 'reload:script') {
      reload()
    } else if (data.type === 'reload') {
      location.reload()
    }
  }

}

module.exports = function() {
  let pageStr = page.toString()
  pageStr = pageStr.substring(pageStr.indexOf("{") + 1, pageStr.lastIndexOf("}"));
  return `
    ;(function(win, doc) { 
      ${pageStr} 
    })(window, document);
  `
}
