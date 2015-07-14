"use strict";

module.exports = (function() {

  var util = require("util");
  var EventEmitter = require("events").EventEmitter;
  var net = require('net');
  var localConf = require('./config.local.json');

  /* Cleans the input of carriage return, newline */
  function cleanInput(data) {

    return data.toString().replace(/(\r\n|\n|\r)/gm,"");

  }

  /* Parse data */
  function parseData(data, cb) {

    var arr = cleanInput(data).split(",");

    var parseResult = {};

    if((arr[0][0] == "$") && (arr[0][1] == "$")) { // Checks valid leading characters
      console.log("parsing data %s",data);
      
      
      var year =  2000 + Number(arr[6].slice(0,2));
      var month = Number(arr[6].slice(2, 4)) - 1; // Convert between 1-12 and 0-11 month format
      var day = Number(arr[6].slice(4,6));
      var d = new Date(Date.UTC(year, month, day, 0, 0, 0));
	
      d.setHours(Number(arr[6].slice(6,8)));
      d.setMinutes(Number(arr[6].slice(8,10)));
      d.setSeconds(Number(arr[6].slice(10)));
       
      parseResult.deviceData = {};
      parseResult.deviceData.deviceId = arr[1];
      parseResult.deviceData.lat = arr[4];
      parseResult.deviceData.lon = arr[5];
      parseResult.deviceData.timestamp = d.getTime();
      parseResult.deviceData.speed = arr[10];
      parseResult.deviceData.direction = arr[11];
	  parseResult.deviceData.numSatellites = arr[9];
	  parseResult.deviceData.accuracy = arr[13];
	  pareResult.deviceData.mileage = arr[15];
	  parseResult.deviceData.received = Date.now();
	  parseResult.deviceData.ordNum = localConf.num;
	  localConf.num++;
	  fs.writeFile('config.local.json', JSON.stringify(localConf), function (err) {
		  if (err) throw err;
		  console.log('Saved ordinal number - ' + localConf.num);
		});
      parseResult.error = false;

    }

    else {
      console.log("failed to parse data %s",data);
      parseResult.error = true;
    }

    cb(parseResult);
  }

  /* To destroy socket */
  function closeSocket(socket) {

    var i = this._sockets.indexOf(socket);

    if (i != -1) {
      console.log("closing socket");
      this._sockets.splice(i, 1);
      socket.destroy();
    } else {
      console.log("received close for unknown socket");
    }

  }

  /* Callback method for new socket */
  function newSocket(socket) {
    var self = this;

    this._sockets.push(socket);
    console.log('accepted connection');

    socket.on('data', function(data) {
      receiveData.call(self, socket, data);
    })

    socket.on('end', function() {
      closeSocket.call(self, socket);
    })

  }

  function isMonitored(deviceId) {
    var monitored = -1;
    for (var i = 0; i < this._config.sensors.length; i++) {
      if (this._config.sensors[i].deviceId === deviceId) {
        monitored = i;
        break;
      }
    }
    return monitored;
  }

  function receiveData(socket, data) {

    var self = this;

    parseData.call(self, data, function(parseResult) {

      if(!parseResult.error) {
        //socket.end('200');

        var sensorIdx = isMonitored.call(self, parseResult.deviceData.deviceId);
        if (sensorIdx >= 0) {
          self.emit("data", self._config.sensors[sensorIdx].feedId, parseResult.deviceData);
        } else {
          console.log("ignoring data from device %s - not found in config",parseResult.deviceData.deviceId);
        }
      }

      else {
        //socket.end('400');
        console.log('Bad data');
      }
    });
  }

  function MEITEKDriver(config) {

    console.log("creating MEITEK GPS adapter");

    EventEmitter.call(this);
    this._config = config;
    this._sockets = [];
    this._server = null;
  }

  util.inherits(MEITEKDriver, EventEmitter);

  MEITEKDriver.prototype.start = function() {

    console.log("starting MEITEK GPS Adapter");

    // Create a new server and provide a callback for when a connection occurs
    this._server = net.createServer(newSocket.bind(this));

    // Listen on port 8060
    this._server.listen(this._config.port);
  };

  MEITEKDriver.prototype.stop = function() {
    this._server.close();
  };

  return MEITEKDriver;
}());
