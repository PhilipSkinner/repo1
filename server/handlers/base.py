import db
import simplejson as json
import tornado.web
import tornado.auth
import tornado.simple_httpclient as httpclient
import tornado.httpclient
import tornado.locale
import tornado.websocket
import settings

class BaseHandler(tornado.web.RequestHandler):
  def jsonp(self, obj):
    cb = self.get_argument('callback', None)
    if cb == None:
      return self.json(obj)
    data = json.dumps(obj) if not isinstance(obj, basestring) else obj
    self.set_header('Content-Type', 'text/javascript')
    self.write("%s(%s);" % (cb, data))
    
  def json(self, obj):
    data = json.dumps(obj) if not isinstance(obj, basestring) else obj
    self.set_header('Content-Type', 'text/javascript')
    self.write(data)    

class BaseSocketHandler(tornado.websocket.WebSocketHandler):  
  identifier = None
  isgame = False
  clients = []

  def json(self, obj):
    data = json.dumps(obj) if not isinstance(obj, basestring) else obj
    self.write_message(data)
  
  def on_message(self, message):
    message = json.loads(message)
    self.processMessage(message)    
  
  def open(self):
    self.clients.append(self)
      
  def on_close(self):
    self.clients.remove(self)

class StaticFileHandler(tornado.web.StaticFileHandler):
    def set_extra_headers(self, path):
        self.set_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
