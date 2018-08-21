const fetch = require('node-fetch')

class HttpListProviderError extends Error {
  constructor(message, errors) {
    super(message)
    this.errors = errors
  }
}

function HttpListProvider(urls) {
  if (!(this instanceof HttpListProvider)) {
    return new HttpListProvider(urls)
  }

  if (!urls || !urls.length) {
    throw new TypeError(`Invalid URLs: '${urls}'`)
  }

  this.urls = urls
  this.currentIndex = 0
}

HttpListProvider.prototype.send = async function send(payload, callback, errors = []) {
  // save the currentIndex to avoid race condition
  const { currentIndex } = this

  if (errors.length === this.urls.length) {
    callback(new HttpListProviderError('Request failed for all urls', errors))
    return
  }

  const url = this.urls[currentIndex]

  try {
    const result = await fetch(url, {
      headers: {
        'Content-type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(payload)
    }).then(request => request.json())

    callback(null, result)
  } catch (e) {
    this.currentIndex = (currentIndex + 1) % this.urls.length
    this.send(payload, callback, errors.concat(e))
  }
}

module.exports = HttpListProvider
module.exports.HttpListProviderError = HttpListProviderError
