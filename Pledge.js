const dummyFn = () => {
  // Placeholder function
}

function Pledge(fn = dummyFn) {
  this._next = null
  this._value = null
  this._errorHandlers = []
  this._successHandlers = []
  this._state = Pledge.prototype.states.pending

  try {
    fn(this._resolve.bind(this), this._reject.bind(this))
  } catch (e) {
    this._value = e
    this._state = Pledge.prototype.states.rejected
  }
}

Pledge.prototype.catch = function (onError) {
  return this.then(null, onError)
}

Pledge.prototype.then = function (onSuccess, onError) {
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

    try {
      handlerResult = handler(this._value)
    } catch (e) {
      this._next._reject(e)
    }

    if (handlerResult && handlerResult instanceof Pledge) {
      handlerResult
      // todo: investigate .then(this._next._resolve)
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

    try {
      handlerResult = handler(this._value)
    } catch (e) {
      this._next._reject(e)
    }

    if (handlerResult && handlerResult instanceof Pledge) {
      handlerResult
      // todo: investigate .then(this._next._resolve)
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
