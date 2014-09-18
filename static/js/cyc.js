//initialise canvas variables
var canvas;
var canvas_cxt;
var game = 0;
var gameloop;

var player;
var level;
var allObjects = [];

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

//object for the level
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

    this.directionstacks = [[],[],[],[]];

    this.draw = function(){
        thecyclist.general.drawOnCanvas(this);
        //canvas_cxt.drawImage(this.sprite, 0,0);
        //canvas_cxt.drawImage(this.sprite, this.spritex, this.spritey, this.spritewidth, this.spriteheight, this.xpos, this.ypos, this.actorwidth, this.actorheight);
    };

    //go through all of the direction stacks and check to see if there's space for these vehicles to reappear
    //if there is, pop them off the stack, make them active, and let them get on their way
    this.checkOffScreen = function(){
        for(i = 0; i < this.directionstacks.length; i++){
            var thisstack = this.directionstacks[i];
            if(thisstack.length){
                hasCollision = 0;
                var thisobject = thisstack[thisstack.length - 1];
                loopcheck:
                for(z = 0; z < allObjects.length; z++){ //compare with all objects
                    if(thisobject.id != allObjects[z].id){ //compare only if it's not the same object
                        if(allObjects[z].active){ //compare only if the object is active i.e. not also in this stack
                            if(collisionDetectDirection(thisobject,allObjects[z],15,thisobject.direction)){
                                hasCollision = 1;
                                break loopcheck;
                            }
                        }
                    }
                }
                //console.log(hasCollision);
                if(!hasCollision){
                    //console.log('pop');
                    thisobject.active = 1;
                    thisstack.pop();
                }
            }

        }
    };
}

//object for a vehicle
function createVehicle(passed){
    this.type = passed['type'];
    this.sprite = passed['img'];
    this.spritex = 0;
    this.spritey = 0;
    this.spritewidth = 50;
    this.spriteheight = 50;
    this.actorwidth = passed['width'];
    this.actorheight = passed['height'];
    this.xpos = 0;
    this.ypos = 0;
    
    this.collisionZoneX;
    this.collisionZoneY;
    this.collisionZoneW;
    this.collisionZoneH;

    this.id = 0;
    this.active = 1;
    this.direction;
    this.moveby = Math.floor(getRandomArbitrary(2,5));
    this.maxspeed = this.moveby;
    this.acceleration = 0.1; //getRandomArbitrary(0.1,0.3);
    this.braking = 1; //getRandomArbitrary(0.8,1);

    this.runActions = function(){
        if(this.active){
            this.checkToMove();
            this.draw();
        }
    };

    this.draw = function(){
        thecyclist.general.drawOnCanvas(this);
    };

    this.checkToMove = function(){
        var offset = this.moveby;
        offset = 15;
        hasCollision = 0;
        
        //if car in front, slow down
        for(z = 0; z < allObjects.length; z++){
            if(allObjects[z].active){
                if(this.id != allObjects[z].id){
                    if(collisionDetectDirection(this,allObjects[z],offset,this.direction)){
                        hasCollision = 1;
                    }
                }
            }
        }
        if(hasCollision){
            //this.moveby = 0;
            this.moveby = Math.max(this.moveby - this.braking, 0);
            hasCollision = 0;
        }
        else {
            this.moveby = Math.min(this.moveby + this.acceleration, this.maxspeed)
        }

        var addtostack = 0;
        //if off screen, reposition on the opposite side to start again
        if(this.moveby){
            switch(this.direction){
                case 0: //north
                    this.ypos -= this.moveby;
                    if(this.ypos < (0 - this.actorheight)){ //if the vehicle has gone off north, add to southern stack
                        this.ypos = canvas.height;
                        addtostack = 1;
                    }
                    break;
                case 1: //east
                    this.xpos += this.moveby;
                    if(this.xpos > canvas.width){
                        this.xpos = 0 - this.actorwidth;
                        addtostack = 1;
                    }
                    break;
                case 2: //south
                    this.ypos += this.moveby;
                    if(this.ypos > canvas.height){
                        this.ypos = 0 - this.actorheight;
                        addtostack = 1;
                    }
                    break;
                case 3: //west
                    this.xpos -= this.moveby;
                    if(this.xpos < (0 - this.actorwidth)){
                        this.xpos = canvas.width;
                        addtostack = 1;
                    }
                    break;
            }
        }
        if(addtostack){
            //console.log('adding ' + this.id + ' to stack');
            level.directionstacks[this.direction].push(this);
            this.active = 0;
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
    
    //fixme need to do collision detection for a car as a space half the length of the car and a bit wider, starting from 3/4 of the way from the back of the car

    var offset_n = 0;
    var offset_e = 0;
    var offset_s = 0;
    var offset_w = 0;

    switch(direction){
        case 0: //north
            offset_n = obj.actorheight / 2;
            break;
        case 1: //east
            offset_e = obj.actorwidth / 2;
            break;
        case 2: //south
            offset_s = obj.actorheight / 2;
            break;
        case 3: //west
            offset_w = obj.actorwidth / 2;
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
            allObjects = [];

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
        //initialise data for the level object
        setupLevel: function(){
            var data = roaddata(canvas);
            level = new createLevel(data[0]);

        },
        //initialise data for the vehicles
        setupVehicles: function(){
            var data = vehicledata(canvas);
            var vehtmp;
            var vehid = 1
            var spacing = 10;
            var xpos_north = canvas.width / 2.8; //left side of the road
            var xpos_south = canvas.width / 1.9; //right side of the road
            var ypos_east = xpos_north; //assuming a square canvas
            var ypos_west = xpos_south; //assuming a square canvas, otherwise canvas.height / 1.9;

            //used to place vehicles without overlapping them
            var directors = [0,0,canvas.height,canvas.width];
            
            var berandom = 1;
            var vehiclecount,routecount = 0;
            vehiclecounts = [0,0,0,0];
            for(i = 0; i < level.routes.length; i++){ //count the number of routes
                if(level.routes[i])
                    routecount++;
            }

            //fixme this all seems too complicated. Isn't there a simpler way?
            if(!berandom){ //evenly spread the total vehicles between the available routes
                vehiclecount = Math.floor(level.vehcount / routecount); //divide the number of cars by the number of routes
                for(i = 0; i < level.routes.length; i++){ //add that number to each available route
                    if(level.routes[i])
                        vehiclecounts[i] = vehiclecount;
                }
            }
            else { //randomly spread the total vehicles between the available routes, tends to result in less jams
                vehiclecount = level.vehcount;
                for(i = 0; i < level.routes.length; i++){
                    if(level.routes[i]){
                        if(routecount > 1){
                            vehiclecounts[i] = Math.floor(getRandomArbitrary(0,vehiclecount + 1));
                            vehiclecount = vehiclecount - vehiclecounts[i];
                            routecount--;
                        }
                        else {
                            vehiclecounts[i] = vehiclecount;
                        }
                    }
                }
            }
            console.log(vehiclecounts);

            for(i = 0; i < vehiclecounts.length; i++){
                for(y = 0; y < vehiclecounts[i]; y++){
                    vehtmp = new createVehicle(data[0]);
                    vehtmp.id = vehid++;
                    vehtmp.direction = i;
    
                    //now pre-calculate the collision detection zone for this vehicle. It should be slightly wider than the vehicle, half the length, and start somewhere near the
                    //front of the vehicle. This will be used to check if anything else is in this space, and react accordingly
                    /* fixme - not sure this will work. We'll need to constantly update these numbers
                    switch(vehtmp.direction){
                        case 0: //north
                            vehtmp.collisionZoneX = 0;
                            vehtmp.collisionZoneY = 0;
                            vehtmp.collisionZoneW = 0;
                            vehtmp.collisionZoneH = 0;
                            break;
                        case 1:
                            break;
                        case 2:
                            break;
                        case 3:
                            break;
                    }
                    */
    
                    //select a position within the height or width of the page (depending on direction) as the start position
                    //set the other value of width or height based on the direction and side of the road it should be on
                    //fixme this is all fairly similar, could be condensed?
                    switch(vehtmp.direction){
                        case 0: //heading north
                            vehtmp.xpos = xpos_north;
                            if(directors[vehtmp.direction] < canvas.height){
                                if(!level.priority[vehtmp.direction]){ //if this direction has been set as a priority, we can have traffic anywhere in the lane, if not, leave a gap in the middle
                                    if(directors[vehtmp.direction] > canvas.height / 4 && directors[vehtmp.direction] < (canvas.height / 4) * 3){
                                        directors[vehtmp.direction] = (canvas.height / 4) * 3 + 1;
                                    }
                                }
                                vehtmp.ypos = directors[vehtmp.direction] + Math.floor(getRandomArbitrary(vehtmp.actorheight,vehtmp.actorheight + spacing));
                                directors[vehtmp.direction] = vehtmp.ypos + vehtmp.actorheight;
                            }
                            else {
                                vehtmp.ypos = canvas.height;
                                vehtmp.active = 0;
                                level.directionstacks[vehtmp.direction].push(vehtmp);
                            }
                            break;
                        case 1: //heading east
                            vehtmp.ypos = ypos_east;
                            if(directors[vehtmp.direction] < canvas.width){
                                if(!level.priority[vehtmp.direction]){ //if this direction has been set as a priority, we can have traffic anywhere in the lane, if not, leave a gap in the middle
                                    if(directors[vehtmp.direction] + vehtmp.actorwidth > canvas.width / 4 && directors[vehtmp.direction] < (canvas.width / 4) * 3){
                                        directors[vehtmp.direction] = (canvas.width / 4) * 3 + 1;
                                    }
                                }
                                vehtmp.xpos = directors[vehtmp.direction] + Math.floor(getRandomArbitrary(vehtmp.actorwidth,vehtmp.actorwidth + spacing));
                                directors[vehtmp.direction] = vehtmp.xpos + vehtmp.actorwidth;
                            }
                            else {
                                vehtmp.xpos = 0 - vehtmp.actorwidth;
                                vehtmp.active = 0;
                                level.directionstacks[vehtmp.direction].push(vehtmp);
                            }
                            break;
                        case 2: //heading south
                            vehtmp.xpos = xpos_south;
                            if(directors[vehtmp.direction] > 0){
                                //console.log('ok ' + directors[vehtmp.direction]);
                                if(!level.priority[vehtmp.direction]){ //if this direction has been set as a priority, we can have traffic anywhere in the lane, if not, leave a gap in the middle
                                    if(directors[vehtmp.direction] > canvas.height / 4 && directors[vehtmp.direction] < (canvas.height / 4) * 3){
                                        directors[vehtmp.direction] = (canvas.height / 4) + vehtmp.actorheight;
                                    }
                                }
                                vehtmp.ypos = directors[vehtmp.direction] - Math.floor(getRandomArbitrary(vehtmp.actorheight,vehtmp.actorheight - spacing));
                                directors[vehtmp.direction] = vehtmp.ypos - vehtmp.actorheight;
                            }
                            else {
                                //console.log('adding to stack ' + directors[vehtmp.direction]);
                                vehtmp.ypos = 0 - vehtmp.actorheight;
                                vehtmp.active = 0;
                                level.directionstacks[vehtmp.direction].push(vehtmp);
                            }
                            break;
                        case 3: //heading west
                            vehtmp.ypos = ypos_west;
                            if(directors[vehtmp.direction] > 0){
                                if(!level.priority[vehtmp.direction]){ //if this direction has been set as a priority, we can have traffic anywhere in the lane, if not, leave a gap in the middle
                                    if(directors[vehtmp.direction] > canvas.width / 4 && directors[vehtmp.direction] - vehtmp.actorwidth < (canvas.width / 4) * 3){
                                        directors[vehtmp.direction] = (canvas.width / 4) - vehtmp.actorwidth;
                                    }
                                }
                                vehtmp.xpos = directors[vehtmp.direction] - Math.floor(getRandomArbitrary(vehtmp.actorwidth,vehtmp.actorwidth - spacing));
                                directors[vehtmp.direction] = vehtmp.xpos - vehtmp.actorwidth;
                            }
                            else {
                                vehtmp.xpos = canvas.width;
                                vehtmp.active = 0;
                                level.directionstacks[vehtmp.direction].push(vehtmp); //push this vehicle onto the direction stack for this direction
                            }
                            break;
                    }
                    allObjects.push(vehtmp);
                }
            }

            /* bit of debug stuff here
            directioncount = [0,0,0,0];
            for(i = 0; i < allObjects.length; i++){
                directioncount[allObjects[i].direction] += 1;
            }
            console.log(directioncount[0] + " cars heading north");
            console.log(directioncount[1] + " cars heading east");
            console.log(directioncount[2] + " cars heading south");
            console.log(directioncount[3] + " cars heading west");
            console.log(level.directionstacks[0].length + " cars in north stack");
            console.log(level.directionstacks[1].length + " cars in east stack");
            console.log(level.directionstacks[2].length + " cars in south stack");
            console.log(level.directionstacks[3].length + " cars in west stack");
            */

        }
    },
    game: {
        gameLoop: function(){ //put code in here that needs to run for the game to work
            if(game){
                thecyclist.general.clearCanvas(canvas,canvas_cxt); //clear canvas
                level.draw(); //draw level
                for(i = 0; i < allObjects.length; i++){ //draw vehicles
                    allObjects[i].runActions();
                }
                level.checkOffScreen();
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