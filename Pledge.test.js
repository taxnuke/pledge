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
    }, 100)
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
    }, 100)
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
    }, 100)
  })

  promise
    .then(() => {
      return new P(function (resolve) {
        setTimeout(() => {
          resolve(err)
        }, 100)
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
    }, 100)
  })

  promise
    .then(() => {
      return new P(function (resolve, reject) {
        setTimeout(() => {
          reject(err)
        }, 100)
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
    }, 100)
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
        }, 100)
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
    }, 100)
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
    }, 100)
  })

  promise
    .then(function b() {
      throw new Error('some Error')
    })
    .catch(function c() {
      return new P(function d(resolve) {
        setTimeout(function e() {
          resolve(foo)
        }, 100)
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
    }, 100)
  })

  promise
    .then(() => {
      throw new Error('some Error')
    })
    .catch(() => {
      return new P(function (resolve, reject) {
        setTimeout(() => {
          reject(err)
        }, 100)
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
    }, 100)
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
    }, 100)
  })

  promise
    .then(
      () => {
        return new P(function (resolve, reject) {
          setTimeout(() => {
            reject(err)
          }, 100)
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
