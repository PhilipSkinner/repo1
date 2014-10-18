from mongoengine import *

connection = None

class QR(Document):
  url = StringField()
  
  def to_object(self):
    return {
      "id"	: str(self.id),
      "url"	: str(self.url),
      "image"	: "/static/qr/%s.png" % str(self.id),
    }

class User(Document):
  uniqueID = StringField()
  name = StringField()
  
  def to_object(self):
    return {
      "id"	: str(self.uniqueID),
      "name"	: str(self.name),
    }

class Bar(Document):
  name = StringField()
  
  def to_object(self):
    return {
      "name"		: str(self.name),
    }
  
class BarQueue(Document):
  position = IntField()
  bar = ReferenceField(Bar, dbref=True)
  user = ReferenceField(User, dbref=True)
  
  def to_object(self):
    return {
      "position" : self.position,
      "bar" : self.bar.to_object(),
      "user" : self.user.to_object(),
    }
    
  def get_status(self):    
    pos = 99999
    if self.position != None:
      pos = self.position
  
    return {
      "position" : pos,
      "timeleft" : pos * 30,
    }

class BarCode(Document):
  promoName = StringField()
  reward = StringField()
  
  def to_object(self):
    return {
      "id"		: str(self.id),
      "promoName" 	: str(self.promoName),
      "reward"		: str(self.reward),
    }
