/**
 * Placeholder function
 */
const dummyFn = () => {}

/**
 * Represents a promise object
 * @param {Function} fn - executor function (can be omitted)
 * @constructor
 */
function Pledge(fn = dummyFn) {
  this._next = null
  this._value = null
  this._errorHandlers = []
  this._successHandlers = []
  this._state = Pledge.prototype.states.pending

  this._attempt(() => {
    fn(this._resolve.bind(this), this._reject.bind(this))
  }, e => {
    this._value = e
    this._state = Pledge.prototype.states.rejected
  })
}

/**
 * Add an error handler
 * @param {Function} onError - error handler
 * @return {Pledge}
 */
Pledge.prototype.catch = function (onError) {
  return this.then(null, onError)
}

/**
 * Add a success [and/or an error] handler
 * @param {Function} onSuccess - success handler
 * @param {Function} onError - error handler
 * @return {Pledge}
 */
Pledge.prototype.then = function (onSuccess, onError = null) {
  if (onSuccess) {
    this._successHandlers.push(onSuccess)
  }

  if (onError) {
    this._errorHandlers.push(onError)
  }

  if (this._state === Pledge.prototype.states.resolved) {
    this._runSuccessHandlers(this._value)
  }

  if (this._state === Pledge.prototype.states.rejected) {
    this._runErrorHandlers(this._value)
  }

  this._next = new Pledge()

  if (this._state === Pledge.prototype.states.rejected) {
    this._next._reject(this._value)
  }

  return this._next
}

Pledge.prototype._runSuccessHandlers = function () {
  this._successHandlers.forEach(handler => {
    let handlerResult

    this._attempt(() => {
      handlerResult = handler(this._value)
    }, e => this._next._reject(e))

    if (handlerResult && handlerResult instanceof Pledge) {
      handlerResult
        .then(result => this._next._resolve(result))
        .catch(error => this._next._reject(error))
    } else {
      this._next._resolve(handlerResult)
    }
  })
}

Pledge.prototype._runErrorHandlers = function () {
  if (this._errorHandlers.length < 1 && this._next) {
    this._next._reject(this._value)

    return
  }

  this._errorHandlers.forEach(handler => {
    let handlerResult

    this._attempt(() => {
      handlerResult = handler(this._value)
    }, e => this._next._reject(e))

    if (handlerResult && handlerResult instanceof Pledge) {
      handlerResult
        .then(result => this._next._resolve(result))
        .catch(error => this._next._reject(error))
    } else {
      if (this._next) {
        this._next._resolve(handlerResult)
      }
    }
  })
}

Pledge.prototype._reject = function (error) {
  if (this._state === Pledge.prototype.states.pending) {
    this._value = error
    this._state = Pledge.prototype.states.rejected
    this._runErrorHandlers()
  }
}

Pledge.prototype._resolve = function (result) {
  if (this._state === Pledge.prototype.states.pending) {
    this._value = result
    this._state = Pledge.prototype.states.resolved
    this._runSuccessHandlers()
  }
}

/**
 * Try-catch blocks prevent function body optimizations in older versions of V8,
 * so _attempt function was created to be the only unoptimized function in such
 * a case
 *
 * @param {Function} fn function to run
 * @param {Function} exceptionHandler - exception handler
 * @return {*}
 * @private
 */
Pledge.prototype._attempt = function (fn, exceptionHandler = dummyFn) {
  try {
    return fn()
  } catch (ex) {
    exceptionHandler(ex)
  }
}

Pledge.prototype.states = Object.freeze({
  pending: Symbol('pending'),
  resolved: Symbol('resolved'),
  rejected: Symbol('rejected')
})

module.exports = Pledge
