// TODO check config format, provide a default config
const path = require('path')
let _config = require(path.resolve(process.cwd(), './config'))
if (typeof _config === 'function') {
  _config = config()
}
_config.root = path.resolve(process.cwd(), _config.server.root)

config = _config // export config to global scope
