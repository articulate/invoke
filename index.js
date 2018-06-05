const { backoff, promisify, reject } = require('@articulate/funky')

const {
  compose, curry, evolve, ifElse, merge,
  objOf, pipe, pipeP, prop, propEq
} = require('ramda')

const InvocationType = 'RequestResponse'

const opts = {
  base: 64,
  tries: Infinity,
  when: propEq('statusCode', 429)
}

const invoke = (lambda, FunctionName) => {
  const inflateError = data => {
    const err = new Error(`[${FunctionName}] ${data.errorMessage}`)
    err.FunctionName = FunctionName
    err.name = data.errorType
    err.upstreamStack = data.stackTrace
    return err
  }

  const checkError = ifElse(
    prop('FunctionError'),
    compose(reject, inflateError, prop('Payload')),
    prop('Payload')
  )

  return backoff(opts,
    pipe(
      JSON.stringify,
      objOf('Payload'),
      merge({
        FunctionName,
        InvocationType
      }),
      pipeP(
        promisify(lambda.invoke, lambda),
        evolve({ Payload: JSON.parse }),
        checkError
      )
    )
  )
}

module.exports = curry(invoke)
