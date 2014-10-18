window.barID = '5442992688c76e31befda3c4';
window.timeout = 2;
window.gameState = null;
window.queueTimeout = null;

function loadQR() {
  $.getJSON('/qr', function(data) {
    if (data && data.data && data.data.qr) {
      $('#qr .img').html('<img src="' + data.data.qr.image + '">');
    }
  });
}

function refreshScores() {  
  if (window.players[1].identifier) {
    $('#player1 .name').html(window.players[1].name);
  } else {
    $('#player1 .name').html("Player 1");  
  }
  $('#player1 .score')[0].className = 'score';
  $('#player1 .score').addClass('score' + Math.floor(window.players[1].score/100));

  if (window.players[2].identifier) {
    $('#player2 .name').html(window.players[2].name);
  } else {
    $('#player2 .name').html("Player 2");   
  }
  $('#player2 .score')[0].className = 'score';
  $('#player2 .score').addClass('score' + Math.floor(window.players[2].score/100));
}

function checkQueue() {
  var url = '/queue?bar=' + this;
  if (gameState == null) {
    //we need to fetch two players
    url += '&required=2';
  } else if (gameState == false) {
    //we need to fetch the next player
    url += '&required=1';
  }

  $.getJSON(url, function(data) {      
    if (data && data.data) {
      if (data.data.players) {
        if (data.data.players.length == 2) {
          window.players[1].identifier = data.data.players[0].user.id;
          window.players[1].name = data.data.players[0].user.name;
          
          window.players[2].identifier = data.data.players[1].user.id;
          window.players[2].name = data.data.players[1].user.name;
        } else if (data.data.players.length == 1) {
          if (window.players[1].identifier == null) {
            window.players[1].identifier = data.data.players[0].user.id;
            window.players[1].name = data.data.players[0].user.name;
          } else {
            window.players[2].identifier = data.data.players[0].user.id;
            window.players[2].name = data.data.players[0].user.name;          
          }
        }

        if (window.players[1].identifier && window.players[2].identifier) {          
          gameState = true;
        }
        
        refreshScores();
      }
    
      if (data.data.queue && data.data.queue.length > 0) {        
        $('#queue .next').html('');
        for (var i = 0; i < data.data.queue.length && i < 5; i++) {
          var peep = data.data.queue[i];
        
          var num = Math.ceil(Math.random() * 7);        
          var html = '<div class="queueMember"><img src="/static/profile' + num + '.png"><b>' + peep.user.name + '</b></div>';
        
          $('#queue .next').append(html);
        }
        
        if (data.data.queue.length > 5) {
          $('#queue .next').append('<div class="queueMember more"><b>+' + (data.data.queue.length - 5) + ' more</b></div>');
        }
        
        $('#queue').removeClass('empty');
        $('#queue').addClass('full');
      } else {
        $('#queue').removeClass('full');
        $('#queue').addClass('empty');
      }
    }
  });
  
  clearTimeout(window.queueTimeout);
  window.queueTimeout = setTimeout(checkQueue.bind(this), 5000);
}
  
function connectionOpened(e) {   
  ws.send(JSON.stringify({ identifier : Math.ceil(Math.random() * 1000000), action : 'registergame' }));  
};

function receiveMessage(e) {
  if (e && e.data) {
    var data = JSON.parse(e.data);
    data.identifier = data.id;
    
    if (data && data.data) {
      if (data.data.x && data.data.y) {
        if (window.players[1].identifier == data.identifier) {      
          window.players[1].glass.nudge(data.data);
        } else if (window.players[2].identifier == data.identifier) {      
          window.players[2].glass.nudge(data.data);        
        }
      }
    }
  }
}

function receiveInstructions() {
  window.ws = new WebSocket("ws://10.12.75.36:8034/socket");
 
  ws.onmessage = receiveMessage;
  ws.onclose = function(evt) { 
  }; 
  ws.onopen = connectionOpened;
}

$(document).ready(function() {
  loadQR();
  //init the table
  window.arena = table(700, 700, $('#game'));
  
  //initialize our glasses
  window.players = {
    '1' : {
      score : 0,
      identifier : null,
      name : 'Player 1',
      glass : glass({ x : 600, y : 340 }, { width : 100, height: 100 }, $('#game'), function() {}),
    },
    '2' : { 
      score : 0,
      identifier : null,
      name : 'Player 2',
      glass : glass({ x : 900, y : 340 }, { width: 100, height: 100 }, $('#game'), function() {}),
    }
  };
  
  checkCollisions();

  //connect to the service
  receiveInstructions();
  
  refreshScores();
  checkQueue.bind(window.barID)();
  checkCollisions();  
});

function resetGame() {
  refreshScores();

  $('.beerglass').remove();

  window.players[1].glass = glass({ x : 600, y : 340 }, { width : 100, height: 100 }, $('#game'), function() {});
  window.players[2].glass = glass({ x : 900, y : 340 }, { width: 100, height: 100 }, $('#game'), function() {});

  if (gameState) {  
    gameState = false;
  }
  
  checkQueue.bind(window.barID)();
  checkCollisions();
  gameState = true;
}

function checkCollisions(glass) {
  if (!window.players) {
    return;
  }

  if (window.players[1].glass.collidesWith(window.players[2].glass)) {
  }

  if (gameState != null) {  
    //did it fall off?
    if (!window.arena.validOpponent(window.players[1].glass)) {
      ws.send(JSON.stringify({ 'action' : 'remove', 'toremove' : window.players[1].identifier }));
    
      window.players[1].identifier = null;
      window.players[1].score = 0;
      window.players[2].score += 100;
    
      resetGame();
      
      return;
    }
    if (!window.arena.validOpponent(window.players[2].glass)) {
      ws.send(JSON.stringify({ 'action' : 'remove', 'toremove' : window.players[2].identifier }));

      window.players[2].identifier = null;
      window.players[2].score = 0;
      window.players[1].score += 100;
    
      resetGame();
      
      return;
    }  
  }

  setTimeout(checkCollisions, timeout);
}

var table = function(width, height, element) {
  var t = {
    initialize : function(width, height, element) {
      this.width = width;
      this.height = height;
      this.element = element;
      
      //create table elem
      this.table = $('<div class="table"></div>');      
      this.process();
      
      this.element.append(this.table);
      
      return this;
    },        
    
    process: function() {
      this.table.css('width', this.width);
      this.table.css('height', this.height);
      this.table.css('position', 'absolute');
      this.table.css('top', '50%');
      this.table.css('left', '50%');
      this.table.css('border-radius', '100%');
      this.table.css('margin-left', -(this.width/2));
      this.table.css('margin-top', -(this.height/2));
    },

    getCenter: function() {
      return {
        x : this.element.width() / 2,
        y : this.element.height() / 2,
      };
    },
    
    validOpponent: function(glass) {
      var glassCenter = glass.getCenter();
      var center = this.getCenter();
      
      var distance = Math.sqrt(Math.pow((center.x - glassCenter.x),2) + Math.pow((center.y - glassCenter.y),2));
      
      if (distance > this.width / 2) {
        return false;
      }

      return true;
    },
  };
  
  return t.initialize(width, height, element);
}

var glass = function(position, size, element, callback) {
  var t = {
    initialize : function(position, size, element, callback) {
      this.callback = callback;
      this.element = element;
      this.size = size;
      this.position = position;
      this.movement = {
        x : 0,
        y : 0,
      };
      
      this.drag = 0.98;
      this.dragRandom = 0.05;
    
      //render in place
      this.glass = $('<div class="beerglass"></div>');      
      this.glass.css('width', this.size.width);
      this.glass.css('height', this.size.height);
      
      this.process();
    
      this.element.append(this.glass);
      
      return this;
    },
  
    process: function() {
      //calculate our drag
      this.movement.x *= (this.drag - (Math.random() * this.dragRandom));
      this.movement.y *= (this.drag - (Math.random() * this.dragRandom));
    
      //adjust            
      this.position.x += this.movement.x;
      this.position.y += this.movement.y;
      
      this.glass.css('left', this.position.x);
      this.glass.css('top', this.position.y);
      
      if (this.callback) {
        this.callback(this);
      }
      
      setTimeout(this.process.bind(this), window.timeout);
    },        
    
    nudge: function(vector) {
      this.movement.x += (vector.x * 5);
      this.movement.y += (vector.y * 5);
    },
    
    calculateCollision: function(glass) {
      var ret = [];

      var thisMovement = {
        x : this.movement.x,
        y : this.movement.y,
      };      
      
      var theirMovement = {
        x : glass.movement.x,
        y : glass.movement.y,
      };
      
      var thisCenter = this.getCenter();
      var theirCenter = glass.getCenter();
      
      //which one is bigger?
      if (Math.abs(this.movement.x) + Math.abs(this.movement.y) > Math.abs(glass.movement.x) + Math.abs(glass.movement.y)) {
	//centers offline?
        var ourV = {};
        var theirV = {};
        
        if (thisCenter.x > theirCenter.x) {
          ourV.x = (thisMovement.x + theirMovement.x) * 0.8;
          theirV.x = -(theirMovement.x + thisMovement.x) * 1.5;
        } else {
          ourV.x = -(thisMovement.x + theirMovement.x) * 0.8;
          theirV.x = (theirMovement.x + thisMovement.x) * 1.5;
        }
         
        if (thisCenter.y > theirCenter.y) {
          ourV.y = (thisMovement.y + theirMovement.y) * 0.8;
          theirV.y = -(theirMovement.y + thisMovement.y) * 1.5;
        } else {
          ourV.y = -(thisMovement.y + theirMovement.y) * 0.8;
          theirV.y = (theirMovement.y + thisMovement.y) * 1.5;
        }
         
        ret.push(ourV);
        ret.push(theirV);
      } else {
        var ourV = {};
        var theirV = {};
        if (thisCenter.x > theirCenter.x) {
          ourV.x = (thisMovement.x + theirMovement.x) * 1.5;
          theirV.x = -(theirMovement.x + thisMovement.x) * 0.8;
        } else {
          ourV.x = -(thisMovement.x + theirMovement.x) * 1.5;
          theirV.x = (theirMovement.x + thisMovement.x) * 0.8;
        }
         
        if (thisCenter.y > theirCenter.y) {
          ourV.y = -(thisMovement.y + theirMovement.y) * 1.5;
          theirV.y = (theirMovement.y + thisMovement.y) * 0.8;
        } else {
          ourV.y = (thisMovement.y + theirMovement.y) * 1.5;
          theirV.y = -(theirMovement.y + thisMovement.y) * 0.8;
        }

        ret.push(ourV);
        ret.push(theirV);
      }
      
      return ret;
    },
    
    collidesWith: function(glass) {
      var centerA = this.getCenter();
      var centerB = glass.getCenter();
      
      var distance = Math.sqrt(Math.pow((centerA.x - centerB.x), 2) + Math.pow((centerA.y - centerB.y), 2));
      
      if (distance - ((this.size.width / 2) + (glass.size.width / 2)) < 0) {
	//now shift them so they dont
	while (distance - ((this.size.width / 2) + (glass.size.width / 2)) < 0) {
		centerA = this.getCenter();
		centerB = glass.getCenter();
		
		if (centerA.x > centerB.x) {
		  //shift it 1px
		  this.position.x += 1;
		  glass.position.x -= 1;
		} else {
		  this.position.x -= 1;
		  glass.position.x += 1;
		}
		
		if (centerA.y > centerB.x) {
		  this.position.y += 1;
		  glass.position.x -= 1;
		} else {
		  this.position.y -= 1;
		  glass.position.x += 1;
		}
		
	      	distance = Math.sqrt(Math.pow((centerA.x - centerB.x), 2) + Math.pow((centerA.y - centerB.y), 2));
	}

        var vectors = this.calculateCollision(glass);
        
        this.movement = vectors[0];
        glass.movement = vectors[1];
      
        return true;
      }
      
      return false;
    },
    
    getCenter: function() {
      return {
        x : this.position.x + (this.size.width / 2),
        y : this.position.y + (this.size.height / 2),
      };
    },    
  };
  
  var ret = t.initialize(position, size, element, callback);
  return ret;
};
