# HttpListProvider

This module is a [web3](https://github.com/ethereum/web3.js/) provider that
allows using several RPC URLs (instead of just one, like `HttpProvider`). If one
of these URLs is not working, the next one in the list will be used.

## Installation

```
npm install http-list-provider
```

## Usage

Create the provider instance with a list of RPC URLs:

```javascript
const Web3 = require('web3')
const HttpListProvider = require('http-list-provider')

const provider = new HttpListProvider(['https://mainnet.infura.io', 'http://localhost:8545'])
const web3 = new Web3(provider)
```

### Retrying

`http-list-provider` uses [`promise-retry`](https://github.com/IndigoUnited/node-promise-retry)
to allow retrying when all the URLs fail. By default, retrying is disabled.
You can enable it by doing:

```javascript
const provider = new HttpListProvider(['https://mainnet.infura.io', 'http://localhost:8545'], {
  retry: {
    retries: 1,
    minTimeout: 10000
  }
})
```

The object under the `retry` key will be passed as it is to `promise-retry` and
used for retrying.

## Testing

To run the tests, start [ganache-cli]() in the default (8545) port and then run
`npm test`.
