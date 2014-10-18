import db
import simplejson as json
import mongoengine
import tornado.web
import tornado.auth
import tornado.simple_httpclient
import tornado.locale
import settings
import re

from base import *

class IndexHandler(BaseHandler):
  def get(self):
    self.jsonp({ 'hello' : 'world' })
    return

class SocketHandler(BaseSocketHandler):
  def get(self):
    self.json({ 'hello' : 'world' })
    return

class RegisterHandler(BaseHandler):
  def get(self):
    self.jsonp({ 'hello' : 'world' })
    return

class QueueHandler(BaseHandler):
  def get(self):
    self.jsonp({ 'hello' : 'world' })
    return

class GamePageHandler(BaseHandler):
  def get(self):
    f = open('game/index.html', 'r')
    self.write(f.read())        

class ControllerPageHandler(BaseHandler):
  def get(self):
    f = open('controller/index.html', 'r')
    self.write(f.read())

URLS = [
  ('/', IndexHandler),
  ('/socket', SocketHandler),
  ('/register', RegisterHandler),
  ('/queue', QueueHandler),
  ('/game', GamePageHandler),
  ('/controller', ControllerPageHandler),
]
