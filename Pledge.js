function Pledge(executor) {
  this._handlers = []
  this._nextPledge = undefined
  executor(this._resolve.bind(this))
}

Pledge.prototype._resolve = function (val) {
  this._handlers.forEach(handler => {
    const rv = handler(val)

    if (rv instanceof Pledge) {
      rv.then(res => {
        this._nextPledge._resolve(res)
      })
    }
  })
}

Pledge.prototype.then = function (handler) {
  this._handlers.push(handler)

  if (!this._nextPledge) {
    this._nextPledge = new Pledge(() => {})
  }

  return this._nextPledge
}

const foo = new Pledge((resolve) => {
  setTimeout(() => {
    resolve('hey')
  }, 300)
})

foo
  .then(value => {
    console.log(value)

    return new Pledge((resolve) => {
      setTimeout(() => {
        resolve('eeey')
      }, 2000)
    })
  })
  .then(value => {
    console.log(value)

    return new Pledge((resolve) => {
      setTimeout(() => {
        resolve('yay')
      }, 2000)
    })
  })
  .then(console.log)

foo.then(v => console.log(v + ' again'))
foo.then(v => console.log(v + ' and again'))
