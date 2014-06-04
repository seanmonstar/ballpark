const dbug = require('dbug')('ballpark:benchmark');

const Summary = require('./summary');

function hr(el) {
  return el[0] * 1e9 + el[1];
}

function Benchmark(fn) {
  this._fn = fn;
}

Benchmark.prototype = {

  bench: function bench(iterations) {
    var i = iterations;
    var start = process.hrtime();
    var fn = this._fn;
    while (i--) {
      fn();
    }
    return hr(process.hrtime(start)) / iterations;
  },

  auto: function auto() {
    var sample = this.bench(1);
    var iters;
    if (sample === 0) {
      iters = 10000000;
    } else {
      iters = Math.round(10000000 / Math.max(sample, 1));
    }
    var total = 0;
    while (true) {
      var t = process.hrtime();


      var samples1 = new Array(50);
      var samples5 = new Array(50);
      for (var i = 0; i < samples1.length; i++) {
        samples1[i] = this.bench(iters);
        samples5[i] = this.bench(iters * 5);
      }

      var tdiff = hr(process.hrtime(t));

      var summ = new Summary(samples1);
      var summ5 = new Summary(samples5);
      dbug('summ: %j', summ);
      if (tdiff > 100000000 &&
          summ.medianAbsDevPercent < 1.0 &&
          summ.median - summ5.median < summ5.medianAbsDev) {
        return summ5;
      }

      total += tdiff;
      if (total > 3000000000) {
        return summ5;
      }
      iters *= 2;
    }
  }

};

module.exports = Benchmark;
