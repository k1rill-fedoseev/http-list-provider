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

HttpListProvider.prototype.send = async function send(payload, callback) {
  // save the currentIndex to avoid race condition
  const { currentIndex } = this

  try {
    const [result, index] = trySend(payload, this.urls, currentIndex)
    this.currentIndex = index
    callback(null, result)
  } catch (e) {
    callback(e)
  }
}

async function trySend(payload, originalUrls, initialIndex) {
  const urls = originalUrls.slice(initialIndex).concat(originalUrls.slice(0, initialIndex))
  const errors = []
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    try {
      const result = await fetch(url, {
        headers: {
          'Content-type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(request => request.json())
      return [result, i]
    } catch (e) {
      errors.push(e)
    }
  }

  throw new HttpListProviderError('Request failed for all urls', errors)
}

module.exports = HttpListProvider
module.exports.HttpListProviderError = HttpListProviderError
