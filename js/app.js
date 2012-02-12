var board = function(obj){
  var defaults = {
    id : "jewels",
    rows : 8,
    cols : 6,
    jewels : 5,
    threshold : 3,
    output : {
      blockSize: 50
    }
  };

  this.options = $.extend(defaults,obj);
  this.board = [];
  this.matches = [];

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
          id : unique
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

    //console.log("combined",matches);

    this.matches = matches;
    //return combined.length;
    return matches;
  }

  this.setupTouch = function(){
    var self = this;
    var id = this.options.id;
    document.getElementById(id).ontouchstart = function(event){
      self.touchStarted(event);
    }
    document.getElementById(id).onmousedown = function(event){
      self.touchStarted(event);
    }

    document.getElementById(id).ontouchend = function(event){
      self.touchEnded(event);
    }
    document.getElementById(id).onmouseup = function(event){
      self.touchEnded(event);
    }

    document.getElementById(id).onmousemove = function(event){
      self.touchMoved(event);
    }
    document.getElementById(id).ontouchmove = function(event){
      self.touchMoved(event);
    }
  }

  this.touchStarted = function(event){
    event.preventDefault();
    this.touchDown = true;
    //lets find out which block to grab;
    console.log(Math.floor(event.pageX/this.options.output.blockSize),Math.floor(event.pageY/this.options.output.blockSize));
    console.log("touchStarted",event);
  }

  this.touchMoved = function(event){
    event.preventDefault();
    if(this.touchDown){
      //console.log("touchMoved",event);
    }
  }

  this.touchEnded = function(event){
    event.preventDefault();
    this.touchDown = false;
    console.log("touchEnded",event);
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
        html += this.board[i][j].num; //value 
        html += '</div>';
      }
    }
    return html;
  }


  this.showMatches = function(){
    //check for horizontal. turn red
    _.each(this.matches.horizontal,function(arr){
      _.each(arr,function(a){
        $("#" + a[0] + "_" + a[1]).css({ background: "#C93044"});
      });
    });

    _.each(this.matches.vertical,function(arr){
      _.each(arr,function(a){
        $("#" + a[0] + "_" + a[1]).css({ background: "#3A9CC9"});
      });
    });

    _.each(this.matches.both,function(arr){
      var color = '#'+Math.floor(Math.random()*16777215).toString(16);
      _.each(arr,function(a){
        $("#" + a[0] + "_" + a[1]).css({ background: color});
      });
    });
  }
}

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
