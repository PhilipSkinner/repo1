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
    if db == None:
      return self.json(obj)
    data = json.dumps(obj) if not isinstance(obj, basestring) else obj
    self.set_header('Content-Type', 'text/javascript')
    self.write("%s(%s);" % (cb, data))
    
  def json(self, obj):
    data = json.dumps(obj) if not isinstance(obj, basestring) else obj
    self.set_header('Content-Type', 'text/javascript')
    self.write(data)    

class BaseSocketHandler(tornado.websocket.WebSocketHandler):
  def json(self, obj):
    data = json.dumps(obj) if not isinstance(obj, basestring) else obj
    self.write_message(data)
  
  def on_message(self, message):
    message = json.loads(message)
    self.get(message)    
