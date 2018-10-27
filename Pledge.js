const dummyFn = () => {
  // Placeholder function
}

function Pledge(fn = dummyFn) {
  this._next = null
  this._handlers = []

  this._attempt(fn(this._resolve.bind(this)))
}

Pledge.prototype.then = function (handler) {
  this._handlers.push(handler)
  this._next = new Pledge()

  return this._next
}

Pledge.prototype._resolve = function (result) {
  this._handlers.forEach(handler => {
    const handlerResult = handler(result)

    if (handlerResult && handlerResult instanceof Pledge) {
      handlerResult
      // todo: investigate .then(this._next._resolve)
        .then(result => this._next._resolve(result))
    } else {
      this._next._resolve(handlerResult)
    }
  })
}

Pledge.prototype._attempt = function (fn, exceptionHandler = dummyFn) {
  try {
    return fn();
  } catch (ex) {
    return exceptionHandler(ex);
  }
}

Pledge.prototype.states = Object.freeze({
  pending: Symbol('pending'),
  resolved: Symbol('resolved'),
  rejected: Symbol('rejected')
})

module.exports = Pledge
