import tornado.web
import settings

class Application(tornado.web.Application):
    pass
        
_app = None

def app(handlers=None):
    """Make sure our application is only created once."""
    global _app
    if not _app:
        _app = Application(handlers or [], **settings.APP_SETTINGS)
        
    return _app
