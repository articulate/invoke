const { pick }   = require('ramda')
const { expect } = require('chai')

const invoke = require('.')

describe('invoke', () => {
  const input = { foo: 'bar' }
  const name  = 'my-lambda'
  const res   = require('prop-factory')()
  const spy   = require('@articulate/spy')()

  const failResponse = {
    FunctionError: 'Handled',
    Payload: JSON.stringify({
      errorMessage: 'ruh roh',
      errorType: 'SprocketError',
      stackTrace: []
    })
  }

  const failure = (opts, next) => {
    spy(opts)
    next(null, failResponse)
  }

  const rateLimit = () => {
    let attempt = 4

    return (opts, next) => {
      spy(opts)

      if (--attempt) {
        const err = new Error('Rate exceeded.')
        err.statusCode = 429
        next(err)
      } else {
        next(null, pick(['Payload'], opts))
      }
    }
  }

  const success = (opts, next) => {
    spy(opts)
    next(null, pick(['Payload'], opts))
  }

  beforeEach(() =>
    spy.reset()
  )

  describe('inputs', () => {
    const lambda = { invoke: success }

    beforeEach(() =>
      invoke(lambda, name)(input)
    )

    it('invokes the specified lambda', () =>
      expect(spy.calls[0][0].FunctionName).to.equal(name)
    )

    it('serializes the Payload', () =>
      expect(spy.calls[0][0].Payload).to.equal(JSON.stringify(input))
    )

    it('specifies the RequestResponse invocation type', () =>
      expect(spy.calls[0][0].InvocationType).to.equal('RequestResponse')
    )
  })

  describe('on success', () => {
    const lambda = { invoke: success }

    beforeEach(() =>
      invoke(lambda, name)(input).then(res)
    )

    it('parses the output Payload', () =>
      expect(res()).to.eql(input)
    )
  })

  describe('on failure', () => {
    const lambda = { invoke: failure }

    beforeEach(() =>
      invoke(lambda, name)(input).catch(res)
    )

    it('does not backoff', () =>
      expect(spy.calls.length).to.equal(1)
    )

    it('inflates the upstream error', () => {
      expect(res().message).to.equal('[my-lambda] ruh roh')
      expect(res().FunctionName).to.equal('my-lambda')
      expect(res().name).to.equal('SprocketError')
      expect(res().upstreamStack).to.eql([])
    })
  })

  describe('when concurrency limit reached', () => {
    const lambda = { invoke: rateLimit() }

    beforeEach(() =>
      invoke(lambda, name)(input).then(res)
    )

    it('backs-off invocations until success', () =>
      expect(spy.calls.length).to.equal(4)
    )
  })
})
