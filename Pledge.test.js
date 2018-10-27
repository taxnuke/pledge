const P = require('./Pledge.js');
// const P = Promise

test('executor function is called immediately', function () {
  let string;

  new P(function () {
    string = 'foo'
  });

  expect(string).toBe('foo')
});

test('resolution handler is called when promise is resolved', function (done) {
  let testString = 'foo';

  let promise = new P(function (resolve) {
    setTimeout(function () {
      resolve(testString);
    }, 10);
  });

  promise.then(function (string) {
    expect(string).toBe(testString)
    done()
  });
});

test('promise supports many resolution handlers', function (done) {
  let testString = 'foo';

  let promise = new P(function (resolve) {
    setTimeout(function () {
      resolve(testString);
    }, 10);
  });

  promise.then(function (string) {
    expect(string).toBe(testString);
  });

  promise.then(function (string) {
    expect(string).toBe(testString);
    done()
  });
});


test('resolution handlers can be chained', function (done) {
  let testString = 'foo';

  let promise = new P(function (resolve) {
    setTimeout(function () {
      resolve();
    }, 10);
  });

  promise
    .then(function () {
      return new P(function (resolve) {
        setTimeout(function () {
          resolve(testString);
        }, 10);
      });
    })
    .then(function (string) {
      expect(string).toBe(testString)
      done()
    });
});

test('chaining works with non-promise return values', function (done) {
  let testString = 'foo';

  let promise = new P(function (resolve) {
    setTimeout(function () {
      resolve();
    }, 10);
  });

  promise
    .then(() => testString)
    .then(string => {
      expect(string).toBe(testString)
      done()
    });
});

test('resolution handlers can be attached when promise is resolved', done => {
  let testString = 'foo';

  let promise = new P(function (resolve) {
    setTimeout(function () {
      resolve(testString);
    }, 10);
  });

  promise
    .then(function () {
      setTimeout(function () {
        promise
          .then(function (value) {
            expect(value).toBe(testString)
            done()
          });
      }, 10);
    });
});

xtest('calling resolve second time has no effect', done => {
  let testString = 'foo';
  let testString2 = 'bar';

  let promise = new P(function (resolve) {
    setTimeout(function () {
      resolve(testString);
      resolve(testString2);
    }, 100);
  });

  promise.then(function (value) {
    expect(value).toBe(testString)
    done()
  });
});

xtest('rejection handler is called when promise is rejected', done => {
  let testError = new Error('Something went wrong');

  let promise = new P(function (resolve, reject) {
    setTimeout(function () {
      reject(testError);
    }, 100);
  });

  promise.catch(function (value) {
    expect(value).toEqual(testError)
    done()
  });
});

xtest('rejections are passed downstream', function (done) {
  let testError = new Error('Something went wrong');

  let promise = new P(function (resolve, reject) {
    setTimeout(function () {
      reject(testError);
    }, 100);
  });

  promise
    .then(function () {
      return new P(function (resolve) {
        setTimeout(function () {
          resolve(testError);
        }, 100);
      });
    })
    .catch(function (value) {
      expect(value).toBe(testError)
      done()
    });
});

xtest('rejecting promises returned from resolution handlers are caught properly', done => {
  let testError = new Error('Something went wrong');

  let promise = new P(function (resolve) {
    setTimeout(function () {
      resolve();
    }, 100);
  });

  promise
    .then(function () {
      return new P(function (resolve, reject) {
        setTimeout(function () {
          reject(testError);
        }, 100);
      });
    })
    .catch(function (value) {
      expect(value).toBe(testError)
      done()
    });
});

xtest('rejection handlers catch synchronous errors in resolution handlers', done => {
  let testError = new Error('Something went wrong');

  let promise = new P(function (resolve) {
    setTimeout(function () {
      resolve();
    }, 100);
  });

  promise
    .then(function () {
      throw testError;
    })
    .catch(function (value) {
      expect(value).toBe(testError)
      done()
    });
});

xtest('rejection handlers catch synchronous errors in the executor function', function (done) {
  let testError = new Error('Something went wrong');

  let promise = new P(function () {
    throw testError;
  });

  promise
    .then(function () {
      return new P(function (resolve) {
        setTimeout(function () {
          resolve(testError);
        }, 100);
      });
    })
    .catch(function (value) {
      expect(value).toBe(testError)
      done()
    });
});

xtest('rejection handlers catch synchronous erros', done => {
  let testError = new Error('Something went wrong');

  let promise = new P(function (resolve) {
    setTimeout(function () {
      resolve();
    }, 100);
  });

  promise
    .then(function () {
      throw new Error('some Error');
    })
    .catch(function () {
      throw testError;
    })
    .catch(function (value) {
      expect(value).toBe(testError)
      done()
    });
});

xtest('chaining works after "catch"', function (done) {
  let testString = 'foo';

  let promise = new P(function (resolve) {
    setTimeout(function a() {
      resolve();
    }, 100);
  });

  promise
    .then(function b() {
      throw new Error('some Error');
    })
    .catch(function c() {
      return new P(function d(resolve) {
        setTimeout(function e() {
          resolve(testString);
        }, 100);
      });
    })
    .then(function f(value) {
      expect(value).toBe(testString)
      done()
    });
});


xtest('rejecting promises returned from rejection handlers are caught properly', function (t) {
  let testError = new Error('Something went wrong');


  let promise = new P(function (resolve) {
    setTimeout(function () {
      resolve();
    }, 100);
  });

  promise
    .then(function () {
      throw new Error('some Error');
    })
    .catch(function () {
      return new P(function (resolve, reject) {
        setTimeout(function () {
          reject(testError);
        }, 100);
      });
    })
    .catch(function (value) {
      t.equal(value, testError);
      t.end();
    });
});

xtest('second argument in then is treated as a rejection handler', function (t) {
  let testError = new Error('Something went wrong');


  let promise = new P(function (resolve, reject) {
    setTimeout(function () {
      reject(testError);
    }, 100);
  });

  promise
    .then(
      function () {
      },
      function (error) {
        t.equal(error, testError);
        t.end();
      });

});

xtest('second argument in then is attached to the promise then is called on', function (t) {
  let testError = new Error('Something went wrong');
  let didRun = false;


  let promise = new P(function (resolve) {
    setTimeout(function () {
      resolve();
    }, 100);
  });

  promise
    .then(
      function () {
        return new P(function (resolve, reject) {
          setTimeout(function () {
            reject(testError);
          }, 100);
        });
      },
      function () {
        didRun = true;
      })
    .catch(function (error) {
      t.equal(error, testError);
      t.equal(didRun, false);
      t.end();
    });

});

// const foo = new Pledge((resolve) => {
//   setTimeout(() => {
//     resolve('hey')
//   }, 300)
// })
//
// foo
//   .then(value => {
//     console.log(value)
//
//     return new Pledge((resolve) => {
//       setTimeout(() => {
//         resolve('eeey')
//       }, 2000)
//     })
//   })
//   .then(value => {
//     console.log(value)
//
//     return new Pledge((resolve) => {
//       setTimeout(() => {
//         resolve('yay')
//       }, 2000)
//     })
//   })
//   .then(console.log)
//
// foo.then(v => console.log(v + ' again'))
// foo.then(v => console.log(v + ' and again'))
