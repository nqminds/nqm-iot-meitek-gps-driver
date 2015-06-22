"use strict";

module.exports = (function() {
  
  var util = require("util");
  var EventEmitter = require("events").EventEmitter;
  var net = require('net');
  
  /* Cleans the input of carriage return, newline */
  function cleanInput(data) {
  
	return data.toString().replace(/(\r\n|\n|\r)/gm,"");
	
  }
  
  /* Parse data */
  function parseData(data, cb) {
  
	var parseResult = cleanInput(data).split(",");
	
	if((parseResult[0][0] == "$") && (parseResult[0][1] == "$")) { // Checks valid leading characters
	
		parseResult.deviceData.id = arr[1];
		parseResult.deviceData.lat = arr[4];
		parseResult.deviceData.lon = arr[5];
		parseResult.deviceData.timestamp = Date.now();
		parseResult.deviceData.speed = arr[10];
		parseResult.deviceData.direction = arr[11];
		parseResult.error = false;
		
	}
	
	else parseResult.error = true;
	
	cb(parseResult);
	
  }
  
  /* To destroy socket */
  function closeSocket(socket) {
  
	var i = sockets.indexOf(socket);
	
	if (i != -1) {
		sockets.splice(i, 1);
		socket.destroy();
	}
	
  }
  
  /* Callback method for new socket */
  function newSocket(socket) {
  
	sockets.push(socket);
	socket.write('Launched GPS Tracker Server!\n');
	
	socket.on('data', function(data) {
		receiveData(socket, data);
	})
	
	socket.on('end', function() {
		closeSocket(socket);
	})
	
  }
 

  function receiveData(socket, data) {
  
	var self = this;
	
	parseData(data, function(parseResult) {
	
		if(!parseResult.error) {
			socket.end('200');
			self.emit("data", self._config.feedId, parseResult.deviceData);
		}
		
		else {
			socket.end('400');
			console.error('Bad data');
		}
		
	});
 
  }

  function MEITEKDriver(config) {
  
    console.log("creating MEITEK GPS adapter");
	
    EventEmitter.call(this);
    this._config = config;
	
  }

  util.inherits(MEITEKDriver, EventEmitter);

  MEITEKDriver.prototype.start = function() {
  
    console.log("starting MEITEK GPS Adapter");
	
	// Create a new server and provide a callback for when a connection occurs
	var server = net.createServer(newSocket);
 
	// Listen on port 8060
	server.listen(this._config.port);

  };

  MEITEKDriver.prototype.stop = function() {
	server.close();
  };

  return MEITEKDriver;
}());