const P = require('./Pledge.js')
// const P = Promise

test('initial promise function is called instantly', () => {
  let string

  new P(() => {
    string = 'foo'
  })

  expect(string).toBe('foo')
})

test('success handler is called on resolve', done => {
  let foo = 'foo'

  let promise = new P(function (resolve) {
    setTimeout(() => {
      resolve(foo)
    }, 10)
  })

  promise.then(function (string) {
    expect(string).toBe(foo)
    done()
  })
})

test('supports multiple success handlers', done => {
  let foo = 'foo'

  let promise = new P(function (resolve) {
    setTimeout(() => {
      resolve(foo)
    }, 10)
  })

  promise.then(function (string) {
    expect(string).toBe(foo)
  })

  promise.then(function (string) {
    expect(string).toBe(foo)
    done()
  })
})

test('success handlers are chainable', done => {
  let foo = 'foo'

  let promise = new P(function (resolve) {
    setTimeout(() => {
      resolve()
    }, 10)
  })

  promise
    .then(() => {
      return new P(function (resolve) {
        setTimeout(() => {
          resolve(foo)
        }, 10)
      })
    })
    .then(function (string) {
      expect(string).toBe(foo)
      done()
    })
})

test('chaining works with non-promise return types', done => {
  let foo = 'foo'

  let promise = new P(function (resolve) {
    setTimeout(() => {
      resolve()
    }, 10)
  })

  promise
    .then(() => foo)
    .then(string => {
      expect(string).toBe(foo)
      done()
    })
})

test('complex chaining works', done => {
  new P(resolve => {
    setTimeout(resolve, 20, 'foo')
  })
    .catch(() => {
      throw new Error('Should not have been thrown...')
    })
    .then(result => {
      return P.reject(result)
    })
    .then(() => {
      throw new Error('Should not have been thrown...')
    })
    .then(res => {
      throw new Error('Should not have been thrown...' + res)
    })
    .catch(reason => {
      expect(reason).toBe('foo')
      done()
    })
})

test('very complex chaining works', done => {
  new P((resolve, reject) => {
    setTimeout(reject, 20, 'foo')
  })
    .catch(err => {
      return P.resolve(err)
    })
    .then(result => {
      return P.reject(result)
    })
    .then(() => {
      throw new Error('Should not have been thrown...')
    })
    .then(res => {
      throw new Error('Should not have been thrown...' + res)
    })
    .catch(reason => {
      expect(reason).toBe('foo')
      done()
    })
})

test('success handlers can be attached when a promise is resolved', done => {
  let foo = 'foo'

  let promise = new P(function (resolve) {
    setTimeout(() => {
      resolve(foo)
    }, 10)
  })

  promise
    .then(() => {
      setTimeout(() => {
        promise
          .then(function (value) {
            expect(value).toBe(foo)
            done()
          })
      }, 10)
    })
})

test('calling resolve() for the second time does nothing', done => {
  let foo = 'foo'
  let testString2 = 'bar'

  let promise = new P(function (resolve) {
    setTimeout(() => {
      resolve(foo)
      resolve(testString2)
    }, 10)
  })

  promise.then(function (value) {
    expect(value).toBe(foo)
    done()
  })
})

test('error handler is called on rejection', done => {
  let err = new Error('Something went wrong')

  let promise = new P(function (resolve, reject) {
    setTimeout(() => {
      reject(err)
    }, 10)
  })

  promise.catch(function (value) {
    expect(value).toEqual(err)
    done()
  })
})

test('errors are passed by the chain of promises', done => {
  let err = new Error('Something went wrong')

  let promise = new P(function (resolve, reject) {
    setTimeout(() => {
      reject(err)
    }, 10)
  })

  promise
    .then(() => {
      return new P(function (resolve) {
        setTimeout(() => {
          resolve(err)
        }, 10)
      })
    })
    .catch(function (value) {
      expect(value).toBe(err)
      done()
    })
})

test('rejected promises from success handlers are caught', done => {
  let err = new Error('Something went wrong')

  let promise = new P(function (resolve) {
    setTimeout(() => {
      resolve()
    }, 10)
  })

  promise
    .then(() => {
      return new P(function (resolve, reject) {
        setTimeout(() => {
          reject(err)
        }, 10)
      })
    })
    .catch(function (value) {
      expect(value).toBe(err)
      done()
    })
})

test('error handlers receive synchronous errors from success handlers', done => {
  let err = new Error('Something went wrong')

  let promise = new P(function (resolve) {
    setTimeout(() => {
      resolve()
    }, 10)
  })

  promise
    .then(() => {
      throw err
    })
    .catch(function (value) {
      expect(value).toBe(err)
      done()
    })
})

test('error handlers catch errors thrown from the initial function', done => {
  let err = new Error('Something went wrong')

  let promise = new P(() => {
    throw err
  })

  promise
    .then(() => {
      return new P(function (resolve) {
        setTimeout(() => {
          resolve(err)
        }, 10)
      })
    })
    .catch(function (value) {
      expect(value).toBe(err)
      done()
    })
})

test('error handlers catch synchronous errors', done => {
  let err = new Error('Something went wrong')

  let promise = new P(function (resolve) {
    setTimeout(() => {
      resolve()
    }, 10)
  })

  promise
    .then(() => {
      throw new Error('some Error')
    })
    .catch(() => {
      throw err
    })
    .catch(function (value) {
      expect(value).toBe(err)
      done()
    })
})

test('chaining is possible after .catch()', done => {
  let foo = 'foo'

  let promise = new P(function (resolve) {
    setTimeout(function a() {
      resolve()
    }, 10)
  })

  promise
    .then(function b() {
      throw new Error('some Error')
    })
    .catch(function c() {
      return new P(function d(resolve) {
        setTimeout(function e() {
          resolve(foo)
        }, 10)
      })
    })
    .then(function f(value) {
      expect(value).toBe(foo)
      done()
    })
})

test('rejected promises returned from error handlers are caught', done => {
  let err = new Error('Something went wrong')

  let promise = new P(function (resolve) {
    setTimeout(() => {
      resolve()
    }, 10)
  })

  promise
    .then(() => {
      throw new Error('some Error')
    })
    .catch(() => {
      return new P(function (resolve, reject) {
        setTimeout(() => {
          reject(err)
        }, 10)
      })
    })
    .catch(function (value) {
      expect(value).toBe(err)
      done()
    })
})

test('second argument in then() is treated an error handler', done => {
  let err = new Error('Something went wrong')

  let promise = new P(function (resolve, reject) {
    setTimeout(() => {
      reject(err)
    }, 10)
  })

  promise
    .then(
      () => {
      },
      function (error) {
        expect(error).toBe(err)
        done()
      })

})

test('second argument of then() is attached to the promise on which then() is called', done => {
  let err = new Error('Something went wrong')
  let ran = false

  let promise = new P(function (resolve) {
    setTimeout(() => {
      resolve()
    }, 10)
  })

  promise
    .then(
      () => {
        return new P(function (resolve, reject) {
          setTimeout(() => {
            reject(err)
          }, 10)
        })
      },
      () => {
        ran = true
      })
    .catch(function (error) {
      expect(error).toBe(err)
      expect(ran).toBe(false)
      done()
    })
})

test('non promise objects are convertible with .resolve()', done => {
  const p1 = P.resolve(3)

  p1.then(result => {
    expect(result).toBe(3)
    done()
  })
})

test('non promise objects are convertible with .reject()', done => {
  const p1 = P.reject(3)

  p1.catch(result => {
    expect(result).toBe(3)
    done()
  })
})

test('Pledge.all() awaits for all of its promises to resolve', done => {
  const p1 = P.resolve(3)
  const p2 = 1337
  const p3 = new P(resolve => {
    setTimeout(resolve, 10, 'foo')
  })

  P.all([p1, p2, p3])
    .then(values => {
      expect(values).toEqual([3, 1337, 'foo'])
      done()
    })
})

test('Pledge.all() is rejected on first rejected promise', done => {
  const err = new Error('Rejected')

  const p1 = 0
  const p2 = P.reject(err)
  const p3 = new P(resolve => {
    setTimeout(resolve, 10, 'foo')
  })

  P.all([p1, p2, p3])
    .then(() => {
      throw new Error('Should not have resolved!')
    })
    .catch(e => {
      expect(e).toBe(err)
      done()
    })
})

test('Pledge.race() is rejected on first rejected promise', done => {
  const err = new Error('Rejected')

  const p1 = P.reject(err)
  const p2 = new P(resolve => {
    setTimeout(resolve, 10, 'foo')
  })

  P.race([p1, p2])
    .then(() => {
      throw new Error('Should not have resolved!')
    })
    .catch(e => {
      expect(e).toBe(err)
      done()
    })
})

test('Pledge.race() is resolved on first resoled promise', done => {
  const p1 = new P(resolve => {
    setTimeout(resolve, 20, 'foo')
  })
  const p2 = new P(resolve => {
    setTimeout(resolve, 30, 'bar')
  })
  const p3 = new P(resolve => {
    setTimeout(resolve, 10, 'baz')
  })

  P.race([p1, p2, p3])
    .then(value => {
      expect(value).toBe('baz')
      done()
    })
})
