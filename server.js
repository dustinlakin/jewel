var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);
var _und = require('./js/underscore-min');


app.listen(3000);

var clients = {};
var socketMap = {};
var games = {};
var garbage = [];

app.use(express.static(__dirname ));
//create the game app
app.get('/', function(req, res){
  res.sendfile(__dirname + '/index.html');
});

//set up a "game"
var client = io
.of('/client')
.on('connection', function(socket) {

  socket.emit('socket', { id : socket.id });

  socket.on('setSocket', function(data){
    socketMap[data.socket] = data.client;
    if (!clients[data.client]){
      clients[data.client] = {
        socket : socket,
        game : null
      }
    }else{
      clients[data.client].socket = socket;
    }

    console.log("socket set!", data.client, data.socket);

    cleanGarbage();

    _und.each(clients,function(value,key){
      console.log("client", key, value.socket.id, value.game);
    });
  });

  socket.on('createGame', function(data){
    var gameId = Math.floor(Math.random() * 100000);
    console.log("creating Game: ", gameId);
    games[gameId] = {
      name : data.gameName,
      players : {},
      status : "created",
      time : 120
    };
    games[gameId].players[socketMap[socket.id]] = {
      score : 0
    };
    clients[socketMap[socket.id]].game = gameId;

    socket.emit('joined', { status : true, game: gameId });
    console.log(games);
  });

  socket.on('joinGame', function(data){
    var found = false;
    _und.each(games, function(value,key){
      if(value.name == data.gameName){
        found = true;
        var clientId = socketMap[socket.id];
        games[key].players[clientId] = {
          score : 0
        };
        socket.emit('joined', { status : true, game: key });
        clients[socketMap[socket.id]].game = key;
        console.log("success!", games[key]);
      }
    });

    if(!found){
      socket.emit('joined', { status : false });
      console.log('didn\'t join');
    }
  });

  socket.on('updateScore',function(data){
    games[data.gameId].players[data.clientId].score += data.score;
    //send out update
    _und.each(games[data.gameId].players, function(value,key){
      clients[key].socket.emit('update', games[data.gameId]);
    });
  });

  socket.on('toControllers', function(data){
    _und.each(games[gameNum].controllers,function(controller){
      controller.emit('fromGame',data);
    });
  });
  
  socket.on('disconnect', function () {
    console.log('disconnecting',socket.id);
    //remove from map

    var clientId = socketMap[socket.id];
    delete socketMap[socket.id];

    garbage.push({
      client : clientId,
      socket : socket.id
    });

  });
});

var cleanGarbage = function(){
  console.log("garbage..");
  while (g = garbage.pop()){
    if( clients[g.client].socket.id == g.socket ){
      console.log("deleted!");
      delete clients[g.client];
    }
  }
};


//set up a "controller"
var controller = io
.of('/controller')
.on('connection', function(socket) {
  var gameNum = null;

  socket.on('setGame', function(data) {
    if ( games[data.game] ){
      gameNum = data.game;
      games[gameNum].controllers.push(socket);
      games[gameNum].socket.emit('paired');
    }else{
      console.log("error");
      return null;
    }
  }); 

  socket.on('toGame', function(data){
    if( games[gameNum] )
      games[gameNum].socket.emit('fromController',data);
  });

  /*
  socket.on('leftStart', function(data){
    if( games[gameNum] )
      games[gameNum].socket.emit('left',{});
  });

  socket.on('rightStart', function(data){
    if( games[gameNum] )
      games[gameNum].socket.emit('right',{});
  });

  socket.on('stop', function(data){
    if( games[gameNum] )
      games[gameNum].socket.emit('stop',{});
  });

  socket.on('tilt', function(data){
    if( games[gameNum] )
      games[gameNum].socket.emit('tilt',data);
  });
  */

  socket.on('disconnect', function () {
    if( games[gameNum] ){
      console.log(games[gameNum].controllers);
      console.log(_und.without(games[gameNum].controllers,socket));
    }
  });
});
