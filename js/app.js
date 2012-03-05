var board = function(obj){
  var defaults = {
    id : "jewels",
    rows : 7,
    cols : 6,
    jewels : 5,
    threshold : 3,
    output : {
      blockSize: 52
    }
  };
  var self = this;

  this.options = $.extend(defaults,obj);
  this.board = [];
  this.matches = [];
  this.combo = 1;

  this.touch = {
    down : false,
    startBlock : {
      col : 0,
      row : 0
    },
    start : {
      x:0,
      y:0
    },
    current : {
      x:0,
      y:0
    }
  };

  this.matching = false;
  this.touchDown = false;

  this.createBoard = function(){
    this.board = [];
    for(var i = 0; i < this.options.rows; i++){
      var row = [];
      for(var j = 0; j < this.options.cols; j++){
        var number = Math.floor(Math.random() * this.options.jewels);
        var unique = "block" + i + j + "_" +Math.floor(Math.random() * 10000);
        row[j] = {
          num : number,
          id : unique,
          pos : [i,j]
        }
      }
      this.board[i] = row;
    }
  }

  this.checkBoard = function(direction){
    var matches = {
      horizontal : [],
      vertical : [],
      both : []
    };
    var temp = [];
    var lastJewel = null;

    for(var i = 0; i < this.options.rows; i++){
      var lastJewel = null;
      temp = [];

      //check horizontal
      for(var j = 0; j < this.options.cols; j++){
        if(lastJewel !== this.board[i][j].num){
          if(temp.length >= this.options.threshold){
            matches.horizontal.push(temp);
          }
          temp = [];
        }
        lastJewel = this.board[i][j].num;
        temp.push([i,j]);
      }
      if(temp.length >= this.options.threshold){
        matches.horizontal.push(temp);
      }
    }

    //check vertical
    for(var i = 0; i < this.options.cols; i++){
      var lastJewel = null;
      temp = [];
      for(var j = 0; j < this.options.rows; j++){
        if(lastJewel !== this.board[j][i].num){
          if(temp.length >= this.options.threshold){
            matches.vertical.push(temp);
          }
          temp = [];
        }
        lastJewel = this.board[j][i].num;
        var pos = [j,i];
        temp.push(pos);
      }
      if(temp.length >= this.options.threshold){
        matches.vertical.push(temp);
      }

    }

    //find overlaps (ones that have both)
    var horz = _.flatten(matches.horizontal,true);
    var vert = _.flatten(matches.vertical,true);
    var shared = [];

    for( var i = 0; i < horz.length; i++ ){
      for( var j = 0; j < vert.length; j++ ){
        if( horz[i][0] === vert[j][0] && horz[i][1] === vert[j][1] ){
          shared.push([horz[i][0],horz[i][1]]);
        }
      }
    }

    var count = 0;
    var combined = [];
    //now match up the shared
    _.each(shared, function(share){
      var h = -1;
      var v = -1;
      //find the horzontal share
      _.each(matches.horizontal, function(arr,key){
        _.each(arr,function(item){
          if( item[0] === share[0] && item[1] === share[1] ){
            h = key;
          }
        });
      });

      //and vertical
      _.each(matches.vertical, function(arr,key){
        _.each(arr,function(item){
          if( item[0] === share[0] && item[1] === share[1] ){
            v = key;
          }
        });
      });
      count++;

      var found = false;
      if( combined.length !== 0 ){
        for( var i = 0; i < combined.length; i++ ){
          if( _.indexOf(combined[i].h,h) !== -1 || _.indexOf(combined[i].v,v) !== -1){
            combined[i].h.push(h);
            combined[i].v.push(v);

            combined[i].h = _.unique(combined[i].h);
            combined[i].v = _.unique(combined[i].v);
            found = true;
          }
        }
      }

      if( !found ){
        combined.push({
          h : [h],
          v : [v]
        });
      }
    });

    var toRemove = {
      h : [],
      v : []
    }
    //now lets create the both with the combined ones.
    _.each(combined, function(value,key){
      matches.both[key] = [];
      //console.log("hit",value);
      //vertical
      _.each(value.v, function(vert){
        var temp = matches.vertical[vert];
        toRemove.v.push(vert);
        matches.both[key].push(temp);
      });
      //horizontal
      _.each(value.h, function(horz){
        var temp = matches.horizontal[horz];
        toRemove.h.push(horz);
        matches.both[key].push(temp);
      });
      matches.both[key] = _.flatten(matches.both[key],true);
    });

    //removing from the horz and vertical, Sort by largest first
    toRemove.h = _.sortBy(toRemove.h, function(num){return -num;})
    toRemove.v = _.sortBy(toRemove.v, function(num){return -num;})

    _.each(toRemove.h, function(value){
      matches.horizontal.splice(value,1);
    });

    _.each(toRemove.v, function(value){
      matches.vertical.splice(value,1);
    });


    //check for duplicates Doesn't scale for over 10
    _.each(matches.both, function(both,key){
      //console.log("before",both.length);
      var temp = _.map(both,function(b){
        return b[0] + '' + b[1];
      });
      temp = _.unique(temp);
      temp = _.map(temp,function(b){
        return [b[0],b[1]];
      });
      matches.both[key] = temp;
    });

    if(matches.vertical.length !== 0 || matches.horizontal.length !== 0 || matches.both.length !== 0){
      
      var toRemove = _.flatten(_.union( matches.both, matches.vertical, matches.horizontal),true);
      for(var i = 0, len = toRemove.length; i < len ; i++){
        $("#" +this.board[toRemove[i][0]][toRemove[i][1]].id).css({
          "background-color": "red"
        });
      }
    }
    this.matches = matches;
    //return combined.length;
    return matches;
  }

  this.setupTouch = function(){
    var self = this;
    var id = this.options.id;
    //bind starts
    document.getElementById(id).ontouchstart = function(event){
      self.touchStarted(event);
    }
    document.getElementById(id).onmousedown = function(event){
      self.touchStarted(event);
    }

    //bind the moves
    document.getElementById(id).ontouchend = function(event){
      self.touchEnded(event);
    }
    document.getElementById(id).onmouseup = function(event){
      self.touchEnded(event);
    }

    //bind end
    document.getElementById(id).onmousemove = function(event){
      self.touchMoved(event);
    }
    document.getElementById(id).ontouchmove = function(event){
      self.touchMoved(event);
    }
  }

  this.touchStarted = function(event){
    event.preventDefault();
    this.touch.down = true;
    //lets find out which block to grab;
    var c = Math.floor(event.pageX/this.options.output.blockSize);
    var r = Math.floor(event.pageY/this.options.output.blockSize);
    this.touch.startBlock.row = r;
    this.touch.startBlock.col = c;
    this.touch.current.x = this.touch.start.x = event.pageX;
    this.touch.current.y = this.touch.start.y = event.pageY;

    //console.log("start Block", this.touch.startBlock.col,this.touch.startBlock.row);
    //console.log("start",this.touch.start.x,this.touch.start.y);
  }

  this.touchMoved = function(event){
    event.preventDefault();
    if(this.touch.down){
      this.touch.current.x = event.pageX;
      this.touch.current.y = event.pageY;
      var deltaX = this.touch.current.x - this.touch.start.x;
      var deltaY = this.touch.current.y - this.touch.start.y;
      if( Math.abs(deltaX) > 50 ){
        var dir = "left";
        if( deltaX > 0 ){
          dir = "right";
        }
        this.swapTiles( this.touch.startBlock, dir );
        this.resetTouch();
      }
      if( Math.abs(deltaY) > 50 ){
        var dir = "up";
        if( deltaY > 0 ){
          dir = "down";
        }
        this.swapTiles( this.touch.startBlock, dir );
        this.resetTouch();
      }
    }
  }

  this.touchEnded = function(event){
    if(this.matching)
      return false;

    event.preventDefault();
    if( this.touch.down ){
      var deltaX = this.touch.current.x - this.touch.start.x;
      var deltaY = this.touch.current.y - this.touch.start.y;
      //console.log("traveled", Math.abs(deltaX)  , Math.abs(deltaY) );
      //if( Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10 ){
        if( Math.abs(deltaX) > Math.abs(deltaY) ){
          var dir = "left";
          if( deltaX > 0 ){
            dir = "right";
          }
          this.swapTiles( this.touch.startBlock, dir );
        }else{
          var dir = "up";
          if( deltaY > 0 ){
            dir = "down";
          }
          this.swapTiles( this.touch.startBlock, dir );
        }
      //}
      this.resetTouch();
    }
    //console.log("end",this.touch.current.x,this.touch.current.y);
  }

  this.resetTouch = function(){
    this.touch = {
      down : false,
      startBlock : {
        col : 0,
        row : 0
      },
      start : {
        x:0,
        y:0
      },
      current : {
        x:0,
        y:0
      }
    }
  }

  this.swapTiles = function( tile, direction ){
    var col = tile.col;
    var row = tile.row;

    var first = [row,col];
    var second = [];
    switch( direction ){
      case 'left':
        if( col === 0 )
          return false;
        second = [row,col - 1];
        break;
      case 'right':
        if( col === this.options.cols - 1 )
          return false;
        second = [row,col + 1];
        break;
      case 'up':
        if( row === 0 )
          return false;
        second = [row - 1,col];
        break;
      case 'down':
        if( row === this.options.rows - 1 )
          return false;
        second = [row + 1,col];
        break;
    }
    this.swap(first,second, true);
  }

  this.swap = function( first, second, check){
    var self = this;
    var blockSize = this.options.output.blockSize;
    var count = 0;
    var valid = true;

    //console.log("switch :[" + first[0] + "," + first[1] + "] with [" + second[0] + "," + second[1] + "]");
    //animate first
    $( "#" + this.board[first[0]][first[1]].id ).css({
      "z-index" : 1
    }).animate({
      top: second[0] * blockSize,
      left: second[1] * blockSize
    },function(){
      if( check && count++ == 2 ){
        if( !valid ){
          self.swap(second, first, false);
        }else{
          self.removeMatches();
        }
      }
    });

    //animate second
    $( "#" + this.board[second[0]][second[1]].id ).css({
      "z-index" : 0
    }).animate({
      top: first[0] * blockSize,
      left: first[1] * blockSize
    },function(){
      //check if all three have been called; 
      if( check && count++ == 2 ){
        if( !valid ){
          self.swap(second, first, false);
        }else{
          self.removeMatches();
        }
      }
    });

    //do the swap
    var temp = this.board[first[0]][first[1]];
    this.board[first[0]][first[1]] = this.board[second[0]][second[1]];
    this.board[second[0]][second[1]] = temp;

    if( check ){
      var matches = this.checkBoard();
      if( matches.both.length > 0 || matches.horizontal.length > 0 || matches.vertical.length > 0 ){
        if( count++ == 2 ){
          this.removeMatches();
        }
      }else{
        valid = false;
        if( check && count++ == 2 )
          if( !valid )
            self.swap(second, first, false);
      }
    }
  }

  this.removeMatches = function(){
    self.matching = true;
    var buckets = [];
    var toRemove = _.flatten(_.union( this.matches.both, this.matches.vertical, this.matches.horizontal),true);
    var points = toRemove.length;
    var test1 = 0, test2 = 0;

    _.each(toRemove, function(value){
      if( !buckets[value[1]] ){
        buckets[value[1]] = [];
      }
      buckets[value[1]].push( value[0] );
      var item = this.board[value[0]][value[1]];
      $("#" + item.id ).fadeOut(function(){
        $(this).remove();
      });

      this.board[value[0]][value[1]] = null;
    },this);

    _(buckets).each(function(value,key){
      var stack = [];
      for( var i = this.options.rows -1; i >= 0; i-- ){
        if( this.board[i][key] ){
          stack.push( this.board[i][key] );
        }
      }
      
      var blockSize = this.options.output.blockSize;
      var colors = ["#FFBA00","#E5671A","#A62B56","#085159","#261F26"];
      var count = -1;
      for( var i = value.length-1; i > -1 ; i-- ){
        var number = Math.floor(Math.random() * this.options.jewels);
        var unique = "block" + i + key + "_" +Math.floor(Math.random() * 10000);
        stack.push( {
          num : number,
          id : unique,
          pos : [count,key]
        });
        //create its location as well.
        var top = count-- * blockSize;
        var left = key * blockSize;
        html = '<div id="' + unique + '" class="block" style="top:' + top + 'px; left:' + left + 'px; background-color: ' + colors[number] + ';">';
        $("#" + this.options.id).append(html);
      }

      for( var i = 0, len = stack.length; i < len; i++ ){
        this.board[i][key] = stack.pop();
        var item = this.board[i][key];
        if( item.pos[0] !== i ){
          var speed = 500 * ( i - item.pos[0] );
          test1++;
          $("#" + item.id).animate({
            top: blockSize * i
          },
          function(){
            if(++test2 == test1){
              var matches = self.checkBoard();
              console.log( self.combo * points, self.combo);
              self.addScore( self.combo * points );
              //send the points;
              if(matches.vertical.length !== 0 || matches.horizontal.length !== 0 || matches.both.length !== 0){
                self.combo++;
                setTimeout(function(){
                  self.removeMatches();
                },200);
              }else{
                self.combo = 1;
                self.matching = false;
              }
            }
          });
        }
      }
    },this);
  }

  this.outputBoard = function(){
    var html = ""; //our output
    var blockSize = this.options.output.blockSize;
    var colors = ["#FFBA00","#E5671A","#A62B56","#085159","#261F26"];
    //colors
    /*
    _.each(_.range(5), function(val){
      colors[val] = '#'+Math.floor(Math.random()*16777215).toString(16);
    });
    */
    //output state.
    for( var i = 0; i < this.options.rows; i++){
      var top = i * blockSize;
      for( var j = 0; j < this.options.cols; j++){
        var left = j * blockSize; 

        html += '<div id="' + this.board[i][j].id + '" class="block" style="top:' + top + 'px; left:' + left + 'px; background-color: ' + colors[this.board[i][j].num] + ';">';
        //html += 'o';
        html += '</div>';
      }
    }
    return html;
  }


  this.showMatches = function(){
    //check for horizontal. turn red
    _.each(this.matches.horizontal,function(arr){
      _.each(arr,function(a){
        $('#' + this.board[a[0]][a[1]].id).css({
          'font-weight' : 'bold'
        });
      },this);
    },this);

    _.each(this.matches.vertical,function(arr){
      _.each(arr,function(a){
        $('#' + this.board[a[0]][a[1]].id).css({
          'font-weight' : 'bold'
        });
      },this);
    },this);

    _.each(this.matches.both,function(arr){
      var color = '#'+Math.floor(Math.random()*16777215).toString(16);
      _.each(arr,function(a){
        $('#' + this.board[a[0]][a[1]].id).css({
          'font-weight' : 'bold'
        });
      },this);
    },this);
  }

  this.addScore = function(score){
    game.updateScore(score);
  }
}

var Game = function(obj){
  var self = this;
  this.state = 0;
  this.board;
  this.socket;

  this.score = {
    my : 0,
    opponent : 0
  };

  this.init = function(obj){
    this.clientId = Math.round(Math.random() * 100);
    this.socket = io.connect(obj.location +'client');
    this.socket.on('socket', function(data){
      self.socket.emit('setSocket', {
        client: self.clientId,
        socket: data.id
      });
      console.log(data.id);
    });

    this.socket.on('joined',function(data){
      self.checkJoined(data);
    });

    this.socket.on('update',function(data){
      self.setUpdate(data);
      console.log('update',data);
    });

    this.board = new board({
      socket: this.socket
    });

    //set up first board
    var matches = null;
    var trys = 0;
    do{
      this.board.createBoard();
      matches = this.board.checkBoard();
      trys++;
    }while(matches.vertical.length !== 0 || matches.horizontal.length !== 0 || matches.both.length !== 0)

    var html = this.board.outputBoard();
    $("#jewels").html(html);
    this.board.setupTouch();
    this.board.showMatches();
    console.log("trys",trys);
  };

  this.createGame = function(gameName){
    this.socket.emit('createGame',{
      'gameName' : gameName
    });
  };

  this.joinGame = function(gameName){
    this.socket.emit('joinGame', {
      'gameName' : gameName
    });
  };

  this.updateScore = function(score){
    this.socket.emit('updateScore',{ 
      'gameId' : this.gameId,
      'clientId' : this.clientId,
      'score' : score
    });
  };

  this.setUpdate = function(data){
    _(data.players).each(function(value,key){
      console.log(key, self.client);
      if(key == self.clientId){
        $("#myScore").text(value.score);
      }else{
        $("#opponentScore").text(value.score);
      }
    });

  };

  this.checkJoined = function(data){
    if(data.status){
      this.gameId = data.game;
      console.log("Joined!");
    }else{
      console.log("Failed To Join");
    }
  };

  this.init(obj);
}


var game = new Game({
  location : "http://localhost:3000/"
});

/*
   var b = new board();
   var matches = null;
   var trys = 0;
   do{
   b.createBoard();
   matches = b.checkBoard();
   trys++;
   }while(matches.vertical.length !== 0 || matches.horizontal.length !== 0 || matches.both.length !== 0)
//}while(matches.vertical.length + matches.horizontal.length + matches.both.length < 9)
var html = b.outputBoard();
$("#jewels").html(html);
b.setupTouch();
b.showMatches();
console.log("trys",trys);
*/
$(document).ready(function(){
  window.scroll(0,0);
});
