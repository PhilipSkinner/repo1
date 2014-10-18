import tornado.httpserver
import tornado.ioloop
import tornado.options
import os

import sys
import pymongo
import bson.objectid

pymongo.objectid = bson.objectid
sys.modules["pymongo.objectid"] = bson.objectid

from tornado.options import define, options

application = None

def main():
  import app
  import db
  import handlers
  
  application = app.app(handlers.URLS)
  
  db.connect(
    'repo1',
    'localhost',
  )
    
  server = tornado.httpserver.HTTPServer(application)
  server.listen(8034)
  tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
  tornado.options.parse_command_line()
  main()
