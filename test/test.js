const HttpListProvider = require('..')
const Web3 = require('web3')
const proxy = require('express-http-proxy')
const express = require('express')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
const { expect } = chai

const { HttpListProviderError } = HttpListProvider

describe('http-list-provider', () => {
  let proxy1Handler = null
  let proxy2Handler = null
  let proxy1Requests = 0
  let proxy2Requests = 0

  beforeEach(() => {
    const proxy1 = express()
    const proxy2 = express()

    proxy1Requests = 0
    proxy1.use(
      '/',
      proxy(() => {
        proxy1Requests += 1
        return `http://localhost:8545`
      })
    )

    proxy2Requests = 0
    proxy2.use(
      '/',
      proxy(() => {
        proxy2Requests += 1
        return `http://localhost:8545`
      })
    )

    proxy1Handler = proxy1.listen(8546)
    proxy2Handler = proxy2.listen(8547)
  })

  afterEach(() => {
    proxy1Handler.close()
    proxy2Handler.close()
  })

  it('should throw if called without arguments', () => {
    expect(() => new HttpListProvider()).to.throw()
  })

  it('should throw if called with an empty array', () => {
    expect(() => new HttpListProvider([])).to.throw()
  })

  it("should use the first URL in the list if it's working", () => {
    const web3 = new Web3(new HttpListProvider(['http://localhost:8546', 'http://localhost:8547']))

    return web3.eth.getBlockNumber().then(blockNumber => {
      expect(blockNumber.toString()).to.equal('0')
      expect(proxy1Requests).to.equal(1)
      expect(proxy2Requests).to.equal(0)
    })
  })

  it("should use the second URL in the list if the first it's not working", () => {
    return new Promise((resolve, reject) => {
      proxy1Handler.close(() => {
        const web3 = new Web3(
          new HttpListProvider(['http://localhost:8546', 'http://localhost:8547'])
        )

        return web3.eth
          .getBlockNumber()
          .then(blockNumber => {
            expect(blockNumber.toString()).to.equal('0')
            expect(proxy1Requests).to.equal(0)
            expect(proxy2Requests).to.equal(1)
          })
          .then(resolve, reject)
      })
    })
  })

  it('should keep using the second URL in the list if the first has already failed', () => {
    return new Promise((resolve, reject) => {
      proxy1Handler.close(() => {
        const web3 = new Web3(
          new HttpListProvider(['http://localhost:8546', 'http://localhost:8547'])
        )

        return web3.eth
          .getBlockNumber()
          .then(blockNumber => {
            expect(blockNumber.toString()).to.equal('0')
            return web3.eth.getBlockNumber()
          })
          .then(blockNumber => {
            expect(blockNumber.toString()).to.equal('0')
            expect(proxy1Requests).to.equal(0)
            expect(proxy2Requests).to.equal(2)
          })
          .then(resolve, reject)
      })
    })
  })

  it('should fail if both URLs are not working', () => {
    const whenProxy1Closed = new Promise(resolve => proxy1Handler.close(resolve))
    const whenProxy2Closed = new Promise(resolve => proxy2Handler.close(resolve))

    return Promise.all([whenProxy1Closed, whenProxy2Closed]).then(() => {
      const web3 = new Web3(
        new HttpListProvider(['http://localhost:8546', 'http://localhost:8547'])
      )

      return expect(web3.eth.getBlockNumber()).to.be.rejected
    })
  })

  it('should throw a custom error with an array of errors', () => {
    const whenProxy1Closed = new Promise(resolve => proxy1Handler.close(resolve))
    const whenProxy2Closed = new Promise(resolve => proxy2Handler.close(resolve))

    return Promise.all([whenProxy1Closed, whenProxy2Closed]).then(() => {
      const web3 = new Web3(
        new HttpListProvider(['http://localhost:8546', 'http://localhost:8547'])
      )

      return expect(web3.eth.getBlockNumber())
        .to.be.rejectedWith(HttpListProviderError)
        .then(e => {
          expect(e.errors).to.be.an('array')
          expect(e.errors.length).to.equal(2)
        })
    })
  })
})
