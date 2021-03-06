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

import time
import base64
from PIL import Image as IM
import cStringIO
import urllib

class IndexHandler(BaseHandler):
  def get(self):
    self.jsonp({ 'hello' : 'world' })
    return

class SocketHandler(BaseSocketHandler):
  def processMessage(self, message):     
    if 'id' in message:
      message['identifier'] = message['id']

    if 'identifier' in message and message['identifier'] != None and message['identifier'] != "None":
      self.identifier = message['identifier']
    
    if 'action' in message:
      if message['action'] == 'registergame':
        self.isgame = True
        self.write_message(json.dumps({ 'meta' : { 'code' : '200' } }))
      elif message['action'] == 'command':
        #identify our game window
        for sock in self.clients:
          if sock.isgame:
            sock.write_message(json.dumps({ 'id' : message['identifier'], 'data' : message['data'] }))                        
        self.write_message(json.dumps({ 'meta' : { 'code' : '200' } }))
      elif message['action'] == 'remove':
        if 'toremove' in message:
          for sock in self.clients:
            if sock.identifier == message['toremove']:
	      if 'win' in message:
                sock.write_message(json.dumps({ 'meta' : { 'code' : '200' }, 'data' : { 'won' : 1 } }))
              sock.close()
        
        self.write_message(json.dumps({ 'meta' : { 'code' : '200' } }))
        
    return  

class StatusHandler(BaseHandler):
  def get(self):
    id = self.get_argument('id', None)
    barId = self.get_argument('bar', None)
    
    if id == None:
      self.jsonp({ 'meta' : { 'code' : '500', 'error' : 'I need a user ID!' }, 'data' : {} })
      return
      
    user = db.User.objects(uniqueID = id).first()
    
    if user == None:
      self.jsonp({ 'meta' : { 'code' : '500', 'error' : 'No such user' }, 'data' : {} })
      return
    
    if barId == None:
      self.jsonp({ 'meta' : { 'code' : '500', 'error' : 'There needs to be a bar' }, 'data' : {} })
      return

    bar = db.Bar.objects(id = barId).first()
    
    if bar == None:
      self.jsonp({ 'meta' : { 'code' : '500', 'error' : 'No such bar' }, 'data' : {} })
      return
    
    bq = db.BarQueue.objects(user=user, bar=bar).first()
    
    if bq == None:
      self.jsonp({ 'meta' : { 'code' : '200' }, 'data' : { 'status' : { 'position' : 0 } } })
      return
    
    self.jsonp({ 'meta' : { 'code' : '200' }, 'data' : { 'status' : bq.get_status() } })
    return

class RegisterHandler(BaseHandler):
  def get(self):
    id = self.get_argument('id', None)
    name = self.get_argument('name', None)    
    barId = self.get_argument('bar', None)
    image = self.get_argument('image', None)

    if id == None:
      self.jsonp({ 'meta' : { 'code' : '500', 'error' : 'I need a user ID!' }, 'data' : {} })
      return
    
    if name == None:
      self.jsonp({ 'meta' : { 'code' : '500', 'error' : 'I need a name :(' }, 'data' : {} })
      return
      
    if barId == None:
      self.jsonp({ 'meta' : { 'code' : '500', 'error' : 'There needs to be a bar' }, 'data' : {} })
      return
    
    bar = db.Bar.objects(id = barId).first()
    
    if bar == None:
      self.jsonp({ 'meta' : { 'code' : '500', 'error' : 'No such bar' }, 'data' : {} })
      return
    
    user = db.User(uniqueID = id, name=name)
    user.save()
    
    if image:
	content = urllib.unquote(image)
	img = base64.b64decode(content.split(',')[1])

	f = open('static/users/%s.png' % user.uniqueID, 'w')
	f.write(img)
	f.close()
    
    #get the largest position and add one :) tee hee
    latest = db.BarQueue.objects(bar=bar).order_by('-position').first()
    position = 1
    
    if latest != None and latest.position != None:
      position = latest.position + 1
        
    bq = db.BarQueue(bar = bar, user = user, position = position)
    bq.save()
    
    self.jsonp({ 'meta' : { 'code' : '200' }, 'data' : { 'user' : user.to_object(), 'queue' : bq.to_object(), 'status' : bq.get_status() } })
    return

class QueueHandler(BaseHandler):
  def get(self):
    barId = self.get_argument('bar', None)
    if barId == None:
      self.jsonp({ 'meta' : { 'code' : '500', 'error' : 'Need bar parameter' }, 'data' : {} })
      return
      
    bar = db.Bar.objects(id=barId).first()
    
    if bar == None:
      self.jsonp({ 'meta' : { 'code' : '500', 'error' : 'No such bar' }, 'data' : {} })
      return

    players = []
    queue = []
      
    raw = db.BarQueue.objects(bar=bar).order_by('position')
    if raw != None:
      queue = [q.to_object() for q in raw]
    
      required = self.get_argument('required', None)
      if required != None:
        num = int(required)      
        while num > 0:
          try:
            raw[int(required) - num].delete()
            players.append(queue.pop(0))        
          except:
            pass
          num -= 1
        
    self.jsonp({ 'meta' : { 'code' : '200' }, 'data' : { 'queue' : queue, 'players' : players } })            
    return
    
class QRHandler(BaseHandler):
  def get(self):
    qr = db.QR.objects().first()
    
    if qr != None:
      import os.path
      
      import qrcode
      img = qrcode.make(qr.url)
      img.save('static/qr/%s.png' % str(qr.id))
    
      self.jsonp({ 'meta' : { 'code' : '200' }, 'data' : { 'qr' : qr.to_object() } })
      return
    else:
      self.jsonp({ 'meta' : { 'code' : '404', 'message' : 'No such QR code' }, 'data' : {} })
      return

class GamePageHandler(BaseHandler):
  def get(self, url=None):
    file = 'game/index.html'
    if url != None and url != '':
      file = 'game/%s' % (url.replace('/', ''))

      if url.replace('.css', '') != url:
        self.set_header('Content-Type', 'text/css')

    f = open(file, 'r')
    self.write(f.read())        

class ControllerPageHandler(BaseHandler):
  def get(self, url=None):
    file = 'controller/index.html'
    if url != None and url != '':
      file = 'controller/%s' % (url.replace('/', ''))
      
      if url.replace('.css', '') != url:
        self.set_header('Content-Type', 'text/css')
      
    f = open(file, 'r')
    self.write(f.read())

URLS = [
  ('/', IndexHandler),
  ('/socket', SocketHandler),
  ('/qr', QRHandler),
  ('/register', RegisterHandler),
  ('/status', StatusHandler),
  ('/queue', QueueHandler),
  ('/game(.*)', GamePageHandler),
  ('/controller(.*)', ControllerPageHandler),
  ('/static/(.*)', StaticFileHandler, {'path': '/var/www/repo1/server/static' })
]
