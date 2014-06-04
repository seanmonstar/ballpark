
function percentile(samples, percent) {
  if (samples.length === 1) {
    return samples[0];
  }
  if (percent === 100) {
    return samples[samples.length - 1];
  }

  var len = samples.length - 1;
  var rank = percent / 100 * len;
  var lrank = Math.floor(rank);
  var d = rank - lrank;
  var lo = samples[lrank];
  var hi = samples[lrank + 1];
  return lo + (hi - lo) * d;
}

function winsorize(samples, percent) {
  var lo = percentile(samples, percent);
  var hi = percentile(samples, 100 - percent);
  return samples.map(function(val) {
    if (val > hi) {
      return hi;
    } else if (val < lo) {
      return lo;
    } else {
      return val;
    }
  });
}

function sort(samples) {
  return samples.sort(function(a, b) {
    return (a < b) ? -1 : (a > b) ? 1 : 0;
  });
}

function Summary(_samples) {
  this._samples = winsorize(sort(_samples), 5);
}

function NonWinzorSummary(samples) {
  this._samples = sort(samples);
}
NonWinzorSummary.prototype = Object.create(Summary.prototype);

function getter(name, fn) {
  var privName = '_' + name;
  Object.defineProperty(Summary.prototype, name, {
    get: function() {
      if (!(privName in this)) {
        return this[privName] = fn.call(this);
      }
      return this[privName];
    }
  });
}
function getters(obj) {
  for (var key in obj) {
    getter(key, obj[key]);
  }
}

getters({
  sum: function() {
    return this._samples.reduce(function(prev, curr) {
      return prev + curr;
    });
  },

  avg: function() {
    return this.sum / this._samples.length;
  },

  median: function() {
    return percentile(this._samples, 50);
  },

  min: function() {
    return this._samples[0];
  },


  max: function() {
    return this._samples[this._samples.length - 1];
  },

  variance: function() {
    var avg = this.avg;
    return this._samples.reduce(function(prev, curr) {
      var x = curr - avg;
      return prev + x * x;
    }) / (this._samples.length - 1);
  },

  dev: function() {
    return Math.sqrt(this.variance);
  },

  devPercent: function() {
    return this.dev / this.avg * 100;
  },

  medianAbsDev: function() {
    var median = this.median;
    var abs = this._samples.map(function(v) {
      return Math.abs(median - v);
    });
    var s = new NonWinzorSummary(abs);
    return s.median * 1.4826;
  },

  medianAbsDevPercent: function() {
    return this.medianAbsDev / this.median * 100;
  }

});


module.exports = Summary;
