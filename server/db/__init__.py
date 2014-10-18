from mongoengine import *

connection = None

class QR(Document):
  url = StringField()
  
  def to_object(self):
    return {
      "id"	: str(self.id),
      "url"	: str(self.url),
    }

class User(Document):
  name = StringField()
  
  def to_object(self):
    return {
      "name"	: str(self.name),
    }

class Bar(Document):
  name = StringField()
  
  def to_object(self):
    return {
      "name"		: str(name),
    }
  
class BarQueue(Document):
  bar = ReferenceField(Bar, dbref=True)
  user = ReferenceField(User, dbref=True)
  
  def to_object(self):
    return {
      "bar"
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
