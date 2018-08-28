const fetch = require('node-fetch')
const promiseRetry = require('promise-retry')
const deepmerge = require('deepmerge')

const defaultOptions = {
  retry: {
    retries: 0
  }
}

class HttpListProviderError extends Error {
  constructor(message, errors) {
    super(message)
    this.errors = errors
  }
}

function HttpListProvider(urls, options = {}) {
  if (!(this instanceof HttpListProvider)) {
    return new HttpListProvider(urls)
  }

  if (!urls || !urls.length) {
    throw new TypeError(`Invalid URLs: '${urls}'`)
  }

  this.urls = urls
  this.options = deepmerge(defaultOptions, options)
  this.currentIndex = 0
}

HttpListProvider.prototype.send = async function send(payload, callback) {
  // save the currentIndex to avoid race condition
  const { currentIndex } = this

  try {
    const [result, index] = await promiseRetry(retry => {
      return trySend(payload, this.urls, currentIndex).catch(retry)
    }, this.options.retry)
    this.currentIndex = index
    callback(null, result)
  } catch (e) {
    callback(e)
  }
}

async function trySend(payload, urls, initialIndex) {
  const errors = []

  let index = initialIndex
  for (let count = 0; count < urls.length; count++) {
    const url = urls[index]
    try {
      const result = await fetch(url, {
        headers: {
          'Content-type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(request => request.json())
      return [result, index]
    } catch (e) {
      errors.push(e)
    }
    index = (index + 1) % urls.length
  }

  throw new HttpListProviderError('Request failed for all urls', errors)
}

module.exports = HttpListProvider
module.exports.HttpListProviderError = HttpListProviderError
