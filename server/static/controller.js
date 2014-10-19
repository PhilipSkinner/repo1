

function Controller(canvas) {
    this.canvas = canvas;
    this.x      = 0;
    this.y      = 0;
    this.vec    = { x: 0, y: 0 };
    this.radius = 150;
    this.onAction = null;
    this.image  = null;
    this.setup  = function () {
	var ctrl = this;
	$(this.canvas).addEvent('touchstart', function (evt) {
	    evt.stop();
	    var ctx     = this.getContext("2d");
	    var touches = evt.changedTouches;
	    console.log(touches[0]);
	    var pos     = $(this).getPosition();
	    console.log(pos);
	    ctrl.getRelativePosition(touches[0].pageX,touches[0].pageY);
	    ctrl.drawFinger();
	})
	$(this.canvas).addEvent('touchmove', function (evt) {
	    evt.stop();
	    var ctx     = this.getContext("2d");
	    var touches = evt.changedTouches;
	    console.log(touches[0]);
	    var pos     = $(this).getPosition();
	    console.log(pos);
	    ctrl.getRelativePosition(touches[0].pageX,touches[0].pageY);
	    ctrl.drawFinger();
	})

	$(this.canvas).addEvent('touchend', function (evt) {
	    evt.stop();
	    console.log('end');
	    ctrl.setPositionFromVector({x:0, y:0});
	    ctrl.drawFinger()
	})
	
	this.setPositionFromVector({x:0, y:0})
	this.drawFinger()
	if(this.image) {
	    this.image.onload = function() { console.log('redraw'); ctrl.drawFinger(); }
	}
    }
    
    this.drawFinger = function () {
	this.drawUI();
	var ctx     = this.canvas.getContext("2d");
	var centerX = this.canvas.width / 2;
	var centerY = this.canvas.height / 2;
	var radius  = 20;
	var dist    = Math.sqrt(this.vec.y*this.vec.y + this.vec.x* this.vec.x);
        ctx.beginPath();
        ctx.arc(this.x,this.y, radius * (1 + dist), 0, 2 * Math.PI, false);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#FF0000';
        ctx.stroke();

    }    
 
    this.drawUI = function () {
	var ctx     = this.canvas.getContext("2d");
	var centerX = this.canvas.width / 2;
	var centerY = this.canvas.height / 2;
	ctx.clearRect(0,0,this.canvas.width,this.canvas.height) 
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'green';
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#003300';
        ctx.stroke();
	if(this.image) {
	    var r = this.image.height  / (1.0 * this.image.width);
	    var w = this.image.width; // Math.min(324, this.image.width);
	    var h =  this.image.height; //w * r;
	    console.log(w,h,r)
	    ctx.drawImage(this.image,(this.canvas.width-w)/2,(this.canvas.height - this.image.height) / 2,w,h);
	}
    }
    
    this.setPositionFromVector = function(vec) {
	var cX   = this.canvas.width / 2;
	var cY   = this.canvas.height / 2;
	this.vec = vec;
	this.x   = vec.x * this.radius + cX
	this.y   = vec.y * this.radius * -1 + cY
    }    
 
    this.getRelativePosition = function(pX, pY) {
	var rY = pY - $(this.canvas).getPosition().y;
	var rX = pX - $(this.canvas).getPosition().x;
	console.log(rX,rY);
	console.log(pX,pY);
	var cX = this.canvas.width / 2;
	var cY = this.canvas.height / 2;
	//var y = rY; //(-cY + rY);
	//var x = rX; // -cX + rX;    
//	var vec = { x : this.vec.x + 0, y: this.vec.y + 0 }
//	vec.y  = -1 * (rY - cY) / this.radius;
	//vec.x  = (rX - cX) / this.radius;	
	var vec = {
	    y : -1 * (rY - cY) / this.radius,
	    x : (rX - cX) / this.radius
	}
	if(Math.sqrt(vec.y*vec.y + vec.x* vec.x) > 1) {
	    var angle = Math.atan2(vec.y, vec.x)
	    vec.x     = Math.cos(angle);
	    vec.y     = Math.sin(angle);	    
	}
        this.setPositionFromVector(vec);
	this.drawFinger()
    }

}




function checkStatus() {
    console.log('checkStatus');

    new Request.JSONP({
        url: url + '/status',
        callbackKey: 'callback',
        data: {
    	id: guid,
	bar: bar
        },
        log: true,
        onRequest: function (url) {
        }, 
        onComplete: function (data) {
    	console.log(data);
        	if(data.meta.code != 200) {
        	    alert(data.meta.error);
        	}
                if(data.data.status.position == 0) {
		$('queue').addClass('hidden');
		$('control').removeClass('hidden');
		document.body.style.backgroundImage="url('/static/NES_Controller_Phonebg.png')";
		openWS();

		setTimeout(syncPosition, 100);
        	    return;
        	} else { 	
        	    $('queue_number').innerHTML = data.data.status.position
        	    setTimeout(checkStatus, 500);
        	}
	}
    }).send();

}

var url = "http://fight.reorjs.com";
var bar = getQueryVariable('bar');
var guid = gen_guid();
var username = null;
var ctrl    = null;
if(!bar) {
    alert('No bar parameter, how did you get here? :(');
}


function receiveMessage(e) {
      console.log(e);
      var data = JSON.parse(e.data);
      if(data && data.data && data.data.won == 1) {
	$('canvas').addClass('hidden');
	$('control').addClass('hidden');
	$('won').removeClass('hidden');
	document.body.style.backgroundImage="";
      }
}

function connectionOpened(e) {
	console.log(e);
	sendMessage(0,0);
}

function sendMessage(x,y) {
    ws.send(JSON.stringify( {
	identifier: guid,
	action: 'command',
	data: { 
	    x: x,
	    y: y
	}}));
}

function openWS() {
  window.ws = new WebSocket("ws://fight.reorjs.com/socket");
 
  ws.onmessage = receiveMessage;
  ws.onclose = function(evt) {
	$('canvas').addClass('hidden');
	$('login').removeClass('hidden');
	document.body.style.backgroundImage="";
	guid = gen_guid();
  }; 
  ws.onopen = connectionOpened;
}



function syncPosition() {
    console.log('sync position');
    if(ctrl) {
	if(ctrl.vec.x != 0 || ctrl.vec.y != 0) {
	    sendMessage(ctrl.vec.x, -1 * ctrl.vec.y); 
	}
    }
    setTimeout(syncPosition, 100);
}

window.addEvent('domready', function() {
    $('connect').addEvent('submit', function(e) {
	e.stop();
	//e = new Event(e).stop();
	username = $('username').value
	new Request.JSONP({
	    url: url + '/register',
	    callbackKey: 'callback',
	    data: {
		id: guid,
		name: username,
		bar: bar,
		image: profile_image
	    },
	    log: true,
	    onRequest: function (url) {
	    }, 
	    onComplete: function (data) {
		console.log(data);
		$('queue').removeClass('hidden');
		$('login').addClass('hidden');
		setTimeout(checkStatus, 500);
	    }
	}).send();
    })

var profile_image = null; 

$('file_input').addEvent('change', function(evt) {
    console.log(evt);
    var canvas = document.createElement('canvas');
    var imageObj = new Image()
    var ctx      = canvas.getContext('2d')
    canvas.id = 'hidden_canvas'
//    var w = 200;
//    var h = 200;
    var w = 100;
    var h = 100;
    canvas.width = w;
    canvas.height = h;
    canvas.style.visibility   = "hidden";   
    document.body.appendChild(canvas);  
    var fileloader = new FileReader();
    var fileInput  = event.target.files[0];
    fileloader.readAsDataURL(fileInput);

    fileloader.onload = function() {
        var data = this.result;	    
	console.log(data);
        imageObj.src = data;
    }; 
fileloader.onabort = function() {
        alert("The upload was aborted.");
    };

    fileloader.onerror = function() {
        alert("An error occured while reading the file.");
    };  

    imageObj.onload = function () {
       ctx.clearRect(0,0,w,h);
    ctx.drawImage(imageObj, 0, 0, this.width, this.height, 0, 0, w,h);
    console.log(canvas);
    console.log(canvas.toDataURL());
    profile_image = canvas.toDataURL();
    canvas.dispose();
    $('upload').setStyle('background',"url('" + canvas.toDataURL() + "') no-repeat center center");
    $('upload').setStyle('background-size',"contain");
    $('upload').setStyle('border-radius',"50%");
    }
})

  var el     = document.getElementsByTagName("canvas")[0];
  el.width   = 324; //document.body.clientWidth;
  //el.width   = Math.min(324,document.body.clientWidth); 
  el.height  = 324; //document.body.clientHeight;
  console.log(el);
  ctrl   = new Controller(el);
  ctrl.image = new Image();
  ctrl.image.src = '/static/Controller.png'
  ctrl.onMove = function (vec) {
    console.log('move')
    sendMessage(vec.x,-vec.y);
  }
  ctrl.setup();
console.log("initialized.");
})
