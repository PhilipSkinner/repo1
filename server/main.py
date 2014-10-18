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
import settings

application = None

def main():
  import app
  import db
  import handlers
  
  application = app.app(handlers.URLS)
  settings.APP_SETTINGS['debug'] = True
  settings.APP_SETTINGS['static_path'] = os.path.join('/home/philip/Development/repo1/server', "static"),
  
  db.connect(
    'repo1',
    host='localhost',
    port=27017
  )
  
  #insert default data
  if 1==2:
#    code = db.QR(url='testing')
#    code.save()
    bar = db.Bar(name="Freds bar")
    bar.save()
    
  server = tornado.httpserver.HTTPServer(application)
  server.listen(8034)
  tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
  tornado.options.parse_command_line()
  main()
