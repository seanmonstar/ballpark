#!/usr/local/bin/node

var crypto = require('crypto');
var fs = require('fs');
var spawn = require('child_process').spawn;
var path = require('path');

var ballpark = require('../lib');

var args = process.argv.slice(2);

function hash(name) {
  var hash = crypto.createHash('sha1');
  hash.update(name);
  return hash.digest('hex');
}

function p() {
  console.log.apply(console, arguments);
}

function inliner(srcFn) {
  function __ballparkBench__(__ballparkIterations__) {
    function __ballparkHr__(el) {
      return el[0] * 1e9 + el[1];
    }
    var __ballparkI__ = __ballparkIterations__;
    var __ballparkStart__ = process.hrtime();
    while (__ballparkI__--) {
      '$$replace$$';
    }
    return __ballparkHr__(process.hrtime(__ballparkStart__))
        / __ballparkIterations__;
  }
  var src = srcFn.toString();
  src = src.replace(/^function [a-zA-Z0-9_\$]*\(\) {/, '').slice(0, -1);
  return __ballparkBench__.toString().replace("'$$replace$$';", src);
}

function inline(_file, _name, bench, fn) {
  var srcfile = _file;
  var name = _name + '.' + hash(_name);
  var tmpfile = srcfile + '.' + name + '.ballpark.js';
  fs.createReadStream(srcfile)
    .pipe(fs.createWriteStream(tmpfile))
    .on('finish', function() {
      fs.appendFile(tmpfile, 'exports["' + name + '"] = ' + inliner(bench),
      function(err) {
        if (err) {
          console.log(err);
        }
        fn(tmpfile, name);
      });
    });
}

function isolate(mod, benches) {
  function next() {
    return benches.shift();
  }

  function loop() {
    var bench = next();
    if (bench) {
      inline(args[0], bench, mod[bench], function(file, name) {
        var cp = spawn('node', [process.argv[1], file, name], {
          env: process.env,
          cwd: process.cwd(),
          stdio: 'inherit'
        });
        cp.on('exit', loop);
      });
    } else {
      p('Done.');
    }

    /*if (bench) {
      var cp = spawn('node', [process.argv[1], args[0], bench], {
        env: process.env,
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      cp.on('exit', loop);
    } else {
      p('Done.');
    }*/
  }

  loop();
}


if (!args.length) {
  p('Usage: ballpark <file>');
} else {
  var file = path.join(process.cwd(), args[0]);
  var mod;
  try {
    mod = require(file);
  } catch (e) {
    p('Failed to load file.');
    p(e.stack);
    process.exit(1);
  }
  var testname = args[1];
  if (testname) {
    ballpark(testname, mod[testname]);
  } else {
    isolate(mod, Object.keys(mod));
  }

}
