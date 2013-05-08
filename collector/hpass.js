#!/usr/bin/env node

var port = 678;
var host = "1.2.3.4";

var dgram = require('dgram');

var sender = dgram.createSocket('udp4');


var util = require('util'),
    node_http = require('http'),
    node_url  = require('url'),
    pcap      = require("pcap"), pcap_session,
    options = {};

options.f = "ip proto \\tcp";
pcap_session = pcap.createSession(options.i, options.f, (options.b * 1024 * 1024));

setInterval(function() {
	var stats = pcap_session.stats();
	if (stats.ps_drop > 0) {
		console.log("pcap dropped packets: " + stats.ps_drop);
	}
}, 2000);

function do_capture() {
	var tcp_tracker = new pcap.TCP_tracker();
	pcap_session.on('packet', function(raw_packet) {
		var packet = pcap.decode.packet(raw_packet);
		tcp_tracker.track_packet(packet);
	});
	tcp_tracker.on('http request', function(session, http) {
		if (http.request.headers["X-Real-IP"] != null) {
			//console.log("http request "  + http.request.url + " src " + http.request.headers["X-Real-IP"] + " user agent" + http.request.headers["User-Agent"] );
			var data = {};
			data.src = http.request.headers["X-Real-IP"];
			data.agent = http.request.headers["User-Agent"];
			sender.send(new Buffer(JSON.stringify(data)), 0, JSON.stringify(data).length, port, host, function(err, bytes) {
				if (err) throw err;
			//	console.log("sent");
			});

		}
	});
}




do_capture();
 

process.on('uncaughtException', function(err) {
  console.log("Uncaught Error " + err);
});

