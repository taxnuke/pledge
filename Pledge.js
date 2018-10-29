/**
 * MIT License
 *
 * Copyright (c) 2018 Semyon Fomin
 */

/**
 * Represents a promise object.
 *
 * @param {Function} fn - executor function (can be omitted)
 * @constructor
 */
function Pledge(fn = _dummyFn) {
  this._next = null
  this._value = null
  this._errorHandlers = []
  this._successHandlers = []
  this._finallyHandlers = []
  this._state = Pledge.prototype._states.pending

  this._attempt(() => {
    fn(this._resolve.bind(this), this._reject.bind(this))
  }, e => {
    this._value = e
    this._state = Pledge.prototype._states.rejected
  })
}

/**
 * Returns a promise object that is resolved with the given value.
 *
 * @param {*} value - value the promise must resolve to
 * @return {Pledge}
 */
Pledge.resolve = function (value) {
  const p = new Pledge()
  p._resolve(value)

  return p
}

/**
 * Returns a promise object that is rejected with the given reason.
 *
 * @param {*} reason - reason the promise must be rejected with
 * @return {Pledge}
 */
Pledge.reject = function (reason) {
  const p = new Pledge()
  p._reject(reason)

  return p
}

/**
 * Returns a resolved or rejected promise, depending on the first promise that
 * was resolved or rejected.
 *
 * @param {Iterable} iterable - promises to wait for
 */
Pledge.race = function (iterable) {
  return new Pledge((resolve, reject) => {
    iterable.forEach(promise => {
      if (!(promise instanceof Pledge)) {
        promise = Pledge.resolve(promise)
      }

      promise
        .then(value => {
          resolve(value)
        })
        .catch(err => {
          reject(err)
        })
    })
  })
}

/**
 * Returns a single promise that resolves when all of the promises in the
 * iterable argument have resolved or when the iterable argument contains no
 * promises. It rejects with the reason of the first promise that rejects.
 *
 * @param {Iterable} iterable - promises to wait for
 */
Pledge.all = function (iterable) {
  return new Pledge((resolve, reject) => {
    const values = []

    iterable.forEach((promise, index) => {
      if (!(promise instanceof Pledge)) {
        promise = Pledge.resolve(promise)
      }

      promise
        .then(value => {
          values[index] = value

          if (values.length === iterable.length) {
            resolve(values)
          }
        })
        .catch(err => {
          reject(err)
        })
    })
  })
}

/**
 * Add a finally handler.
 *
 * @param {Function} onFinally - finally handler
 * @return {Pledge}
 */
Pledge.prototype.finally = function (onFinally) {
  if (!this._next) {
    this._next = new Pledge()
  }

  if (onFinally) {
    this._finallyHandlers.push(onFinally)
  }

  if (this._state !== Pledge.prototype._states.pending) {
    this._runFinallyHandlers()
  }

  return this._next
}

/**
 * Add an error handler.
 *
 * @param {Function} onError - error handler
 * @return {Pledge}
 */
Pledge.prototype.catch = function (onError) {
  return this.then(null, onError)
}

/**
 * Add a success [and/or an error] handler.
 *
 * @param {Function} onSuccess - success handler
 * @param {Function} onError - error handler
 * @return {Pledge}
 */
Pledge.prototype.then = function (onSuccess, onError = null) {
  if (!this._next) {
    this._next = new Pledge()
  }

  if (onSuccess) {
    this._successHandlers.push(onSuccess)
  }

  if (onError) {
    this._errorHandlers.push(onError)
  }

  if (this._state === Pledge.prototype._states.resolved) {
    this._runSuccessHandlers(this._value)
  }

  if (this._state === Pledge.prototype._states.rejected) {
    this._runErrorHandlers(this._value)
  }

  if (this._state === Pledge.prototype._states.rejected) {
    this._next._reject(this._value)
  }

  return this._next
}

Pledge.prototype._execHandlers = function (handlers, fallback) {
  if (handlers.length < 1 && this._next) {
    fallback(this._value)

    return
  }

  handlers.forEach(handler => {
    let handlerResult

    this._attempt(() => {
      handlerResult = handler(this._value)
    }, e => this._next._reject(e))

    if (handlerResult && handlerResult instanceof Pledge) {
      handlerResult
        .then(result => {
          this._next._resolve(result)
        }, error => {
          this._next._reject(error)
        })
    } else {
      if (this._next) {
        fallback(handlerResult)
      }
    }
  })
}

Pledge.prototype._runErrorHandlers = function () {
  this._execHandlers(this._errorHandlers, value => {
    this._next._reject(value)
  })
}

Pledge.prototype._runSuccessHandlers = function () {
  this._execHandlers(this._successHandlers, value => {
    this._next._resolve(value)
  })
}

Pledge.prototype._runFinallyHandlers = function () {
  this._finallyHandlers.forEach(handler => {
    let handlerResult

    this._attempt(() => {
      handlerResult = handler()
    }, e => {
      this._next._value = e
      this._next._state = Pledge.prototype._states.rejected
    })

    if (handlerResult && handlerResult instanceof Pledge) {
      handlerResult
        .then(result => {
          this._next._resolve(result)
        }, e => this._next._reject(e))
    } else {
      if (this._state === Pledge.prototype._states.resolved) {
        this._next._resolve(this._value)
      } else if (this._state === Pledge.prototype._states.rejected) {
        this._next._reject(this._value)
      }
    }
  })
}

Pledge.prototype._reject = function (error) {
  if (this._state === Pledge.prototype._states.pending) {
    this._value = error
    this._state = Pledge.prototype._states.rejected
    this._runFinallyHandlers()
    this._runErrorHandlers()
  }
}

Pledge.prototype._resolve = function (result) {
  if (this._state === Pledge.prototype._states.pending) {
    this._value = result
    this._state = Pledge.prototype._states.resolved
    this._runFinallyHandlers()
    this._runSuccessHandlers()
  }
}

/**
 * Try-catch blocks prevent function body optimizations in older versions of V8,
 * so _attempt function was created to be the only unoptimized function in such
 * a case.
 *
 * @param {Function} fn function to run
 * @param {Function} exceptionHandler - exception handler
 * @return {*}
 * @private
 */
Pledge.prototype._attempt = function (fn, exceptionHandler = _dummyFn) {
  try {
    return fn()
  } catch (ex) {
    exceptionHandler(ex)
  }
}

function _dummyFn() {
  // Placeholder function for empty promises
}

Pledge.prototype._states = Object.freeze({
  pending: Symbol('pending'),
  resolved: Symbol('resolved'),
  rejected: Symbol('rejected')
})

module.exports = Pledge
