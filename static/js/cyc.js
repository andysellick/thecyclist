//initialise canvas variables
var canvas;
var canvas_cxt;
var game = 0;
var gameloop;

var player;
var level;
var vehicles = [];
var pedestrians = [];

// Returns a random number between min (inclusive) and max (exclusive)
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

//general object for main character
function createPlayer(){
    this.sprite;
    this.spritex = 0;
    this.spritey = 0;
    this.spritewidth = 20;
    this.spriteheight = 20;
    this.actorwidth;
    this.actorheight;
    this.xpos;
    this.ypos;

    this.draw = function(){
        thecyclist.general.drawOnCanvas(this);
    };
}

function createLevel(passed){
    this.sprite = passed['img'];
    this.spritex = 0;
    this.spritey = 0;
    this.spritewidth = 400;
    this.spriteheight = 400;
    this.actorwidth = passed['width'];
    this.actorheight = passed['height'];
    this.xpos = 0;
    this.ypos = 0;
    
    this.vehcount = passed['vehcount'];
    this.routes = passed['routes'];
    this.junction = passed['junction'];
    this.priority = passed['priority'];

    this.draw = function(){
        thecyclist.general.drawOnCanvas(this);
        //canvas_cxt.drawImage(this.sprite, 0,0);
        //canvas_cxt.drawImage(this.sprite, this.spritex, this.spritey, this.spritewidth, this.spriteheight, this.xpos, this.ypos, this.actorwidth, this.actorheight);
    };
}

function createVehicle(passed){
    this.sprite = passed['img'];
    this.spritex = 0;
    this.spritey = 0;
    this.spritewidth = 50;
    this.spriteheight = 50;
    this.actorwidth = passed['width'];
    this.actorheight = passed['height'];
    this.xpos = 0;
    this.ypos = 0;
    
    this.id = 0;
    this.direction;
    this.moveby = Math.floor(getRandomArbitrary(2,6));
    this.maxspeed = this.moveby;

    this.runActions = function(){
        this.checkToMove();
        this.draw();
    };

    this.draw = function(){
        thecyclist.general.drawOnCanvas(this);
    };

    this.checkToMove = function(){
        var offset = this.moveby;
        offset = 15;
        hasCollision = 0;
        
        //if car in front, slow down
        for(z = 0; z < vehicles.length; z++){
            if(this.id != vehicles[z].id){
                if(collisionDetectDirection(this,vehicles[z],offset,this.direction)){
                    hasCollision = 1;
                }
            }
        }
        if(hasCollision){
            //this.moveby = 0;
            this.moveby = Math.max(this.moveby - 1, 0);
            hasCollision = 0;
        }
        else {
            this.moveby = Math.min(this.moveby + 0.2, this.maxspeed)
        }

        //fixme something is wrong here - cars keep disappearing! Due to varying speed, they get reset on top of each other
        //if off screen, reposition on the opposite side to start again
        if(this.moveby){
            //simple move
            switch(this.direction){
                case 0: //north
                    this.ypos -= this.moveby;
                    if(this.ypos < (0 - this.actorheight))
                        this.ypos = canvas.height - this.ypos;
                    break;
                case 1: //east
                    this.xpos += this.moveby;
                    if(this.xpos > canvas.width)
                        this.xpos = 0 - this.actorwidth - (this.xpos - canvas.width);
                    break;
                case 2: //south
                    this.ypos += this.moveby;
                    if(this.ypos > canvas.height)
                        this.ypos = 0 - this.actorheight - (this.ypos - canvas.height);
                    break;
                case 3: //west
                    this.xpos -= this.moveby;
                    if(this.xpos < (0 - this.actorwidth))
                        this.xpos = canvas.width + this.actorwidth + this.xpos;
                    break;
            }
        }
        //if traffic light does not exist or is green, move
    };
}

//generic collision checking function between any two given objects
//offset allows a gap to be present for collision detection
function checkPlayerCollision(obj,tp,offset){
    //rule out any possible collisions, remembering that all y numbers are inverted on canvas
    //player bottom edge is higher than object top edge
    if(tp.ypos + tp.actorheight < obj.ypos - offset)
        return(0);
    //player top edge is lower than obj bottom edge
    if(tp.ypos > obj.ypos + obj.actorheight + offset)
        return(0);
    //player left edge is to the right of obj right edge
    if(tp.xpos > obj.xpos + obj.actorwidth + offset)
        return(0);
    //player right edge is to the left of obj left edge
    if(tp.xpos + tp.actorwidth < obj.xpos - offset)
        return(0);

    return(1); //collision
}

//check for collisions only in the direction this object is going
//direction is 0,1,2,3 corresponding to n,e,s,w
function collisionDetectDirection(obj,tp,offset,direction){
    var offset_n = 0;
    var offset_e = 0;
    var offset_s = 0;
    var offset_w = 0;

    switch(direction){
        case 0: //north
            offset_n = offset;
            break;
        case 1: //east
            offset_e = offset;
            break;
        case 2: //south
            offset_s = offset;
            break;
        case 3: //west
            offset_w = offset;
            break;
    }
    //rule out any possible collisions, remembering that all y numbers are inverted on canvas
    //player bottom edge is higher than object top edge
    if(tp.ypos + tp.actorheight < obj.ypos - offset_n)
        return(0);
    //player top edge is lower than obj bottom edge
    if(tp.ypos > obj.ypos + obj.actorheight + offset_s)
        return(0);
    //player left edge is to the right of obj right edge
    if(tp.xpos > obj.xpos + obj.actorwidth + offset_e)
        return(0);
    //player right edge is to the left of obj left edge
    if(tp.xpos + tp.actorwidth < obj.xpos - offset_w)
        return(0);
    return(1); //collision
}


(function( window, undefined ) {
var thecyclist = {
    general: {
        //set up function, starts it off
        initialise: function(){
            canvas = document.getElementById('canvas_main');
            this.initCanvasSize();
            canvas_cxt = thecyclist.general.initCanvas(canvas,canvas_cxt);
            this.initGame();
            thecyclist.game.gameLoop();
        },
        initCanvasSize: function(){
            //ideal size for canvas
            var destwidth = 600;
            var destheight = 600;
            var aspect = Math.floor(($(window).height() / destheight) * destwidth);

            var cwidth = Math.min(destwidth, $(window).width());
            var cheight = Math.min(destheight, $(window).height());

            //resize the canvas to maintain aspect ratio depending on screen size
            canvas.width = Math.min($(window).width(),aspect) - 2; //shaving a bit off here to avoid a bit of vertical overlap
            canvas.height = (canvas.width / destwidth) * destheight - 2;
        },
        //initialise the canvas and return the canvas context
        initCanvas: function(canvas, cxt){
            if(canvas.getContext)
                cxt = canvas.getContext('2d');
            else
                $('#' + canvas).html("Your browser does not support canvas. Sorry.");
            return cxt;
        },
        initGame: function(){
            game = 1;
            player = 0;
            level = 0;
            vehicles = [];
            pedestrians = [];

            thecyclist.people.setupPlayer();
            thecyclist.people.setupLevel();
            thecyclist.people.setupVehicles();
        },
        nextLevel: function(){
        },
        endGame: function(){
            canvas_cxt.font = "30px Arial";
            canvas_cxt.fillStyle = "#000000";
            canvas_cxt.textAlign = "center";
            game = 0;
        },
        //draw some object on the canvas
        drawOnCanvas: function(object){
            canvas_cxt.drawImage(object.sprite, object.spritex, object.spritey, object.spritewidth, object.spriteheight, object.xpos, object.ypos, object.actorwidth, object.actorheight);
        },
        //completely clear the canvas
        clearCanvas: function(canvas, cxt){
            cxt.clearRect(0, 0, canvas.width, canvas.height);//clear the canvas
            var w = canvas.width;
            canvas.width = 1;
            canvas.width = w;
        }
    },
    people: {
        //initialise data for the player object
        setupPlayer: function(){
            player = new createPlayer();
            //player.sprite = allimages[0];
            player.actorwidth = canvas.width / 20; //30;
            player.actorheight = canvas.width / 20; //30;
            player.xpos = (canvas.width / 2) - (player.actorwidth / 2);
            player.ypos = canvas.height - player.actorheight;
        },
        setupLevel: function(){
            var data = roaddata(canvas);
            level = new createLevel(data[0]);
        },
        setupVehicles: function(){
            var data = vehicledata(canvas);
            var vehtmp;
            var vehid = 1

            //will be used to place vehicles without overlapping them
            var director_n = 0;
            var director_e = 0;
            var director_s = canvas.height;
            var director_w = canvas.width;

            for(i = 0; i < level.vehcount; i++){
                vehtmp = new createVehicle(data[0]);
                vehtmp.id = vehid++;

                //do vehicle positioning here based on level data

                var chosen = 0;
                //randomly select an available direction and set the vehicle to travel in that direction
                while(chosen == 0){
                    rand = Math.floor(getRandomArbitrary(0,4));
                    if(level.routes[rand]){
                        vehtmp.direction = rand; //this should be a number representing n,e,s,w that the vehicle will travel in
                        chosen = 1;
                    }
                }
                //select a position within the height or width of the page (depending on direction) as the start position
                //set the other value of width or height based on the direction and side of the road it should be on
                
                if(!level.junction){
                }
                
                var spacing = 10;

                switch(vehtmp.direction){
                    case 0: //heading north
                        vehtmp.xpos = canvas.width / 3.1; //left side of the road
                        vehtmp.ypos = director_n + Math.floor(getRandomArbitrary(vehtmp.actorheight,vehtmp.actorheight + spacing));
                        director_n = vehtmp.ypos + vehtmp.actorheight;
                        break;
                    case 1: //heading east
                        vehtmp.xpos = director_e + Math.floor(getRandomArbitrary(vehtmp.actorwidth,vehtmp.actorwidth + spacing));
                        vehtmp.ypos = canvas.height / 3.1;
                        director_e = vehtmp.xpos + vehtmp.actorwidth;
                        break;
                    case 2: //heading south
                        vehtmp.xpos = canvas.width / 1.8; //right side of the road
                        vehtmp.ypos = director_s - Math.floor(getRandomArbitrary(vehtmp.actorheight,vehtmp.actorheight + spacing));
                        director_s = vehtmp.ypos - vehtmp.actorheight;
                        break;
                    case 3: //heading west
                        vehtmp.xpos = director_w - Math.floor(getRandomArbitrary(vehtmp.actorwidth,vehtmp.actorwidth + spacing));
                        vehtmp.ypos = canvas.height / 1.8;
                        director_w = vehtmp.xpos - vehtmp.actorwidth;
                        break;
                }
                vehicles.push(vehtmp);
            }
        }
    },
    game: {
        gameLoop: function(){ //put code in here that needs to run for the game to work
            if(game){
                thecyclist.general.clearCanvas(canvas,canvas_cxt); //clear canvas
                level.draw(); //draw level
                for(i = 0; i < vehicles.length; i++){ //draw vehicles
                    vehicles[i].runActions();
                }
                //player.draw(); //draw player
                gameloop = setTimeout(thecyclist.game.gameLoop,100); //repeat
            }
            else {
                canvas_cxt.fillText("GAME OVER", canvas.width / 2, canvas.height - 60);
            }
        }
    }
};
window.thecyclist = thecyclist;
})(window);

//do stuff
window.onload = function(){
    //when images loaded, proceed with rest
    $.when.apply(null, loaders).done(function() {
        roadimages = preloadImages(roadimages,roadimgdir);
        pedimages = preloadImages(pedimages,pedimgdir);
        vehimages = preloadImages(vehimages,vehimgdir);
        thecyclist.general.initialise();
    });

    $(window).on('resize',function(){
        resetAndResize(); //fixme not sure we want to reset the WHOLE game just because of a browser size change
    });

    function resetAndResize(){
        game = 0;
        level = 1;
        clearTimeout(gameloop);
        thecyclist.general.initCanvasSize();
        thecyclist.general.initGame();
        thecyclist.game.gameLoop();
    }

};