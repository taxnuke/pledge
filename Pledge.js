function Pledge(executor) {
  this._handlers = []
  this._value = undefined
  this._state = Pledge.prototype.states.pending
  this._nextPledge = undefined
  executor(this._resolve.bind(this))
}

Pledge.prototype.states = Object.freeze({
  pending: Symbol('pending'),
  resolved: Symbol('resolved'),
  rejected: Symbol('rejected')
})

Pledge.prototype._executeHandlers = function () {
  this._handlers.forEach(handler => {
    const rv = handler(this._value)

    if (rv && rv instanceof Pledge) {
      rv.then(res => {
        this._nextPledge._resolve(res)
      })
    } else {
      this._nextPledge._resolve(rv)
    }
  })
}

Pledge.prototype._resolve = function (val) {
  if (this._state === Pledge.prototype.states.pending) {
    this._value = val
    this._state = Pledge.prototype.states.resolved
    this._executeHandlers();
  }
}

Pledge.prototype.then = function (handler) {
  this._handlers.push(handler)

  if (this._state === Pledge.prototype.states.resolved) {
    this._executeHandlers();

    return this
  }

  if (!this._nextPledge) {
    this._nextPledge = new Pledge(() => {
    })
  }

  return this._nextPledge
}

module.exports = Pledge
