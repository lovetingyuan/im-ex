function page() { 
  'use strict';
  if (typeof global !== 'object') {
    win.global = win
  }
  win.__NAMESPACE__ = {
    setStyle(content, filePath) {
      const bb = new Blob([content], {type: 'text/css'})
      const bbUrl = URL.createObjectURL(bb)
      // let dom = doc.createElement('link')
      // dom.setAttribute('rel', 'stylesheet')
      // dom.setAttribute('href', bbUrl)
      // doc.head.appendChild(dom)
      // dom = null
      let dom = doc.querySelector(`style[data-path="${filePath}"]`)
      if (dom) {
        dom.innerHTML = content
      } else {
        dom = doc.createElement('style')
        dom.innerHTML = content;
        dom.dataset.path = filePath;
        document.head.appendChild(dom)
      }
      dom = null
    }
  }
  const es = new EventSource('/__SSE__')
  function reload() {
    const entryScript = doc.querySelectorAll('script[data-type=entry]')
    entryScript.forEach(dom => {
      const src = dom.getAttribute('src')
      let script = doc.createElement('script')
      script.setAttribute('type', 'module');
      script.setAttribute('src', src + '&_t=' + Date.now());
      doc.head.appendChild(script)
      script.onload = function () {
        doc.head.removeChild(script)
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
  return `/* injected by im-ex, using global namespace: ${config._browserNameSpace} */
    ;(function(win, doc) {
      ${pageStr.substring(pageStr.indexOf('{') + 1, pageStr.lastIndexOf('}'))} 
    })(window, document);
  `
}
