var Benchmark = require('./benchmark');

function p() {
  var msg = [].join.call(arguments, ' ');
  process.stdout.write(msg);
}

function ln() {
  var args = [].slice.call(arguments);
  args.push('\n');
  p.apply(null, args);
}

function ballpark(name, test) {
  p('benching', name, '...');
  var bench = new Benchmark();
  bench.bench = test;

  var summ = bench.auto();

  ln(Math.round(summ.median), 'ns/iter', '(+/- ',
     Math.round(summ.max - summ.min), ')');

}

module.exports = ballpark;
