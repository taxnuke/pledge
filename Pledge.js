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

//
// function Pledge(executor) {
//   this._resolveHandlers = []
//   this._rejectHandlers = []
//   this._err = undefined
//   this._value = undefined
//   this._state = Pledge.prototype.states.pending
//   this._nextPledge = undefined
//   this._prevPledge = undefined
//
//   try {
//     executor(this._resolve.bind(this), this._reject.bind(this))
//   } catch (e) {
//     this._state = Pledge.prototype.states.rejected
//     this._err = e
//   }
// }
//

//
// Pledge.prototype._runResolveHandlers = function () {
//   this._resolveHandlers.forEach(handler => {
//     try {
//       const rv = handler(this._value)
//
//       if (rv && rv instanceof Pledge) {
//         rv
//           .then(res => this._nextPledge._resolve(res))
//           .catch(err => this._nextPledge._reject(err))
//       } else {
//         this._nextPledge._resolve(rv)
//       }
//     } catch (e) {
//       this._nextPledge._reject(e)
//     }
//   })
// }
//
// Pledge.prototype._runRejectHandlers = function () {
//   this._rejectHandlers.forEach(handler => {
//     try {
//       const rv = handler(this._err)
//
//       if (rv && rv instanceof Pledge) {
//         rv
//           .then(res => this._nextPledge._resolve(res))
//           .catch(res => this._nextPledge._reject(res))
//       } else if (this._nextPledge) {
//         this._nextPledge._reject(rv)
//       }
//     } catch (e) {
//       this._nextPledge._reject(e)
//     }
//   })
// }
//
// Pledge.prototype._resolve = function (val) {
//   if (this._state === Pledge.prototype.states.pending) {
//     this._value = val
//     this._state = Pledge.prototype.states.resolved
//     this._runResolveHandlers();
//   }
// }
//
// Pledge.prototype._reject = function (err) {
//   if (this._state === Pledge.prototype.states.pending) {
//     this._err = err
//     this._state = Pledge.prototype.states.rejected
//     this._runRejectHandlers();
//
//     if (this._nextPledge) {
//       this._nextPledge._reject(err)
//     }
//   }
// }
//
// Pledge.prototype.catch = function (handler) {
//   this._rejectHandlers.push(handler)
//
//   if (this._state === Pledge.prototype.states.rejected) {
//     this._runRejectHandlers();
//
//     // return this
//   }
//
//   if (!this._nextPledge) {
//     this._nextPledge = new Pledge(() => {
//     })
//     this._nextPledge._state = this._state
//     this._nextPledge._value = this._value
//     this._nextPledge._err = this._err
//     this._nextPledge._prevPledge = this
//   }
//
//   return this._nextPledge
// }
//
// Pledge.prototype.then = function (handler) {
//   this._resolveHandlers.push(handler)
//
//   if (this._state === Pledge.prototype.states.resolved) {
//     this._runResolveHandlers();
//
//     // return this
//   }
//
//   if (!this._nextPledge) {
//     this._nextPledge = new Pledge(() => {
//     })
//     this._nextPledge._state = this._state
//     this._nextPledge._value = this._value
//     this._nextPledge._err = this._err
//     this._nextPledge._prevPledge = this
//   }
//
//   return this._nextPledge
// }

module.exports = Pledge
