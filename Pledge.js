function Pledge(executor) {
  this._resolveHandlers = []
  this._rejectHandlers = []
  this._err = undefined
  this._value = undefined
  this._state = Pledge.prototype.states.pending
  this._nextPledge = undefined
  this._prevPledge = undefined

  executor(this._resolve.bind(this), this._reject.bind(this))
}

Pledge.prototype.states = Object.freeze({
  pending: Symbol('pending'),
  resolved: Symbol('resolved'),
  rejected: Symbol('rejected')
})

Pledge.prototype._runResolveHandlers = function () {
  this._resolveHandlers.forEach(handler => {
    const rv = handler(this._value)

    if (rv && rv instanceof Pledge) {
      rv
        .then(res => this._nextPledge._resolve(res))
        .catch(err => this._nextPledge._reject(err))
    } else {
      this._nextPledge._resolve(rv)
    }
  })
}

Pledge.prototype._runRejectHandlers = function () {
  this._rejectHandlers.forEach(handler => {
    const rv = handler(this._err)

    if (rv && rv instanceof Pledge) {
      rv.then(res => this._nextPledge._reject(res))
    } else {
      this._nextPledge._reject(rv)
    }
  })
}

Pledge.prototype._resolve = function (val) {
  if (this._state === Pledge.prototype.states.pending) {
    this._value = val
    this._state = Pledge.prototype.states.resolved
    this._runResolveHandlers();
  }
}

Pledge.prototype._reject = function (err) {
  if (this._state === Pledge.prototype.states.pending) {
    this._err = err
    this._state = Pledge.prototype.states.rejected
    this._runRejectHandlers();

    if (this._nextPledge) {
      this._nextPledge._reject(err)
    }
  }
}

Pledge.prototype.catch = function (handler) {
  this._rejectHandlers.push(handler)

  if (this._state === Pledge.prototype.states.rejected) {
    this._runRejectHandlers();

    return this
  }

  if (!this._nextPledge) {
    this._nextPledge = new Pledge(() => {
    })
    this._nextPledge._prevPledge = this
  }

  return this._nextPledge
}

Pledge.prototype.then = function (handler) {
  this._resolveHandlers.push(handler)

  if (this._state === Pledge.prototype.states.resolved) {
    this._runResolveHandlers();

    return this
  }

  if (!this._nextPledge) {
    this._nextPledge = new Pledge(() => {
    })
    this._nextPledge._prevPledge = this
  }

  return this._nextPledge
}

module.exports = Pledge
