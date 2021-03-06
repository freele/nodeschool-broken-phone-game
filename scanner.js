// at the same time we want to discover other servers
var Connection = require('./connection.js');
var localIpAddress = require('./getOwnIp.js');
var net = require('net');
var evilscan = require('evilscan');

console.log('Local ip address: ', localIpAddress);

module.exports = function (cluster, port) {

  var options = {
    port: port,
    status: 'O',
    target: '192.168.0.0/16', // subnet, hardcoded
    banner: true
  };

  var scanner = new evilscan(options, function (self) {
    console.log('scanner started');
  });

  scanner.on('result',function(data) {
    var ip = data.ip;
    if (ip === localIpAddress || cluster[ip]) {
      // connection is already up
      // or we found ourselves
      return;
    }

    console.log('Connecting to %s...', ip);

    var socket = new net.Socket({
      readable: true,
      writable: true
    });
    socket.connect(port, ip);

    socket.on('error', function (err) {
      console.error('Couldn\'t connect to %s:', ip, err.message);
    });

    socket.on('connect', function () {
      socket.removeAllListeners('error');
      cluster[ip] = new Connection(socket, cluster);
    });

  });

  scanner.on('error',function(err) {
    console.error(err);
  });

  scanner.on('done',function() {
    console.log('done');
  });

  scanner.run();

};
