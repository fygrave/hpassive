#!/usr/bin/env python

from pyes import *
import redis
import logging
import argparse

import SocketServer
import ConfigParser as CFG
import logging


config = None
rediscl = None

class PacketReceiver(SocketServer.BaseRequestHandler):


    def __init__(self, request, client_address, server):
        logger = logging.getLogger()
        logger.info("Server started")
        SocketServer.BaseRequestHandler.__init__(self, request, client_address, server)
        return

    def setredis(self, r):
	self.rediscl = r
    def handle(self):
        logger = logging.getLogger()
        data = self.request[0]
        logger.info("%s" % self.client_address[0])
	try:
		d = json.loads(data)
		m = {}
		m["ip"] = d["src"]
		m["agent"] = d["agent"]
		rediscl.sadd(m["ip"], m["agent"])
	except Exception, e:
		print "error occured %s while processing %s" % (e, data)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Capture useragent forward packets')
    parser.add_argument('config', type=file, help= 'config file')
    parser.set_defaults(config = "packindexer.cfg")
    r = parser.parse_args()
    print r.config


    config = CFG.ConfigParser()
    config.readfp(r.config)
    HOST, PORT = "0.0.0.0", int(config.get("main", "lport"))
    rediscl = redis.Redis(host = config.get("main","redishost"), port = int(config.get("main", "redisport")))
    server = SocketServer.UDPServer((HOST, PORT), PacketReceiver)

    server.serve_forever()

