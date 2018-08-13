# HttpListProvider

This module is a [web3](https://github.com/ethereum/web3.js/) provider that
allows using several RPC URLs (instead of just one, like `HttpProvider`). If one
of these URLs is not working, the next one in the list will be used.

## Installation

```
npm install http-list-provider
```

## Testing

To run the tests, start [ganache-cli]() in the default (8545) port and then run
`npm test`.
