// # Express Dust
// ### Makes dust compatible with Express by leveraging Dust's own cache.

var fs = require('fs')
  , path = require('path')
  , dust = require('dustjs-helpers')
  , views = path.resolve(__dirname, '../views')
  , P = require('bluebird')
  , promisedFile = P.promisify(fs.readFile)
  , loadPromises = {}

// ### Called internally by Dust
// This method is not natively set in Dust. However, it checks if it's been
// made available for us to load yet-unregistered templates.
// Is called following `dust.render` if a file name can't be found.
dust.onLoad = function(name, fn) {
  var _name = name
  if (loadPromises[name]) {
    loadPromises[name].nodeify(fn)
  } else {
    if (path.extname(_name) === '') {
      _name += '.dust'
    }

    if (_name[0] !== '/') {
      _name = views + '/' + _name
    }

    loadPromises[name] = promisedFile(_name, 'utf8')
    // We have to do this since nodeify returns `null` if a callback is given
    loadPromises[name].nodeify(fn)
  }
}

// ### Main function
// Used by Express views. Dust's `render` is still accessible to
// Express's `app.render`.
function expressDust (file, options, fn) {
  var name = path.relative(views, file).replace(/\.dust$/, '')

  // set extra options
  options.filename = file

  dust.render(name, options, fn)
}

module.exports = dust.__express = expressDust
