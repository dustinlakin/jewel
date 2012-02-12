var _und = require('./underscore-min');
var $ = require('jquery').create();  

var board = function(obj){
  var defaults = {
    rows : 8,
    cols : 6,
    jewels : 4,
    threshold : 3
  };

  this.options = $.extend(defaults,obj);
  this.board = [];

  this.createBoard = function(){
    this.board = [];
    for(var i = 0; i < this.options.rows; i++){
      var row = [];
      for(var j = 0; j < this.options.cols; j++){
        row[j] = Math.floor(Math.random() * this.options.jewels);
      }
      this.board[i] = row;
    }
  }

  this.checkBoard = function(direction){
    var matches = {
      horizontal : [],
      vertical : []
    };
    var temp = [];
    var lastJewel = null;

    for(var i = 0; i < this.options.rows; i++){
      var lastJewel = null;
      temp = [];

      //check horizontal
      for(var j = 0; j < this.options.cols; j++){
        if(lastJewel !== this.board[i][j]){
          if(temp.length >= this.options.threshold){
            matches.horizontal.push(temp);
          }
          temp = [];
        }
        lastJewel = this.board[i][j];
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
        if(lastJewel !== this.board[j][i]){
          if(temp.length >= this.options.threshold){
            matches.vertical.push(temp);
          }
          temp = [];
        }
        lastJewel = this.board[j][i];
        var pos = [j,i];
        temp.push(pos);
      }
      if(temp.length >= this.options.threshold){
        matches.vertical.push(temp);
      }
    }

    return matches;
  }
}

var b = new board();
b.createBoard();
var matches = b.checkBoard();
console.log(b.board);
console.log(matches);


