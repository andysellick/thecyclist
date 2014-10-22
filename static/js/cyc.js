//initialise canvas variables
var canvas;
var canvas_cxt;
var game = 0;
var gameloop;

var player;
var level;
var junction;
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
        thecyclist.general.drawObjectOnCanvas(this);
    };
}

//object for the level
function createLevel(passed){
    this.sprites = [0,0,0,0,0,0,0,0];
    this.spritex = 0;
    this.spritey = 0;
    this.spritewidth = 400;
    this.spriteheight = 400;
    this.actorwidth = passed['width'];
    this.actorheight = passed['height'];
    this.xpos = 0; //canvas.width / 2;
    this.ypos = 0; //canvas.height / 2;

    this.vehcount = passed['vehcount'];
    this.routes = passed['routes'];
    this.junction;
    this.priority = passed['priority'];

    this.directionstacks = [[],[],[],[]];

    this.draw = function(){
        for(i = 0; i < this.sprites.length; i++){
            if(this.sprites[i]){
                thecyclist.general.drawOnCanvas(this,this.sprites[i]);
            }
        }
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

//object for the junction
function createJunction(){
    this.sprite;
    this.spritex = 0;
    this.spritey = 0;
    this.spritewidth = 200;
    this.spriteheight = 200;

    this.lights = [1,0,1,0]; //n,e,s,w. If 1, indicates the light in that direction is red
    this.lightswitch = 0; //initial value is important
    this.lightlock = 0;

    this.boundaries = [0,0,0,0]; //used for collision detection
    this.actorwidth;
    this.actorheight;
    this.xpos;
    this.ypos;

    this.draw = function(){
        thecyclist.general.drawOnCanvas(this,this.sprite);
    };

    //initialise the changing of the lights
    this.changeLights = function(){ //assuming we're passing a 1 or a 0 to represent the change
        if(!this.lightlock){
            //console.log('all lights red, changing to %d',direction);
            this.lightlock = 1;
            this.lights = [1,1,1,1]; //turn off all lights
            var _this = this;
            setTimeout(function(){ _this.activateLights(); }, 5000);
        }
    };

    //actually change the lights, called on a timeout to allow traffic to clear
    this.activateLights = function(){
        this.lights[this.lightswitch] = 0;
        this.lights[this.lightswitch + 2] = 0;
        console.log('lights are now ' + this.lights);
        this.lightswitch ^= 1; //switch value between 1 and 0
        this.lightlock = 0;
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
        thecyclist.general.drawObjectOnCanvas(this);
    };

    this.checkToMove = function(){
        var offset = this.moveby;
        offset = 15;
        hasCollision = 0;
        
        //check collisions for other cars
        for(z = 0; z < allObjects.length; z++){
            if(allObjects[z].active){
                if(this.id != allObjects[z].id){
                    if(collisionDetectDirection(this,allObjects[z],offset,this.direction)){
                        hasCollision = 1;
                    }
                }
            }
        }
        //check collisions for junction
        if(junction.lights[this.direction]){
            switch(this.direction){
                case 0: //north
                    if(this.ypos > junction.boundaries[this.direction][0] && this.ypos < junction.boundaries[this.direction][1]){
                        hasCollision = 1;
                    }
                    break;
                case 1: //east
                    if(this.xpos < junction.boundaries[this.direction][0] && this.xpos > junction.boundaries[this.direction][1]){
                        hasCollision = 1;
                    }
                    break;
                case 2: //south
                    if(this.ypos < junction.boundaries[this.direction][0] && this.ypos > junction.boundaries[this.direction][1]){
                        hasCollision = 1;
                    }
                    break;
                case 3: //west
                    if(this.xpos > junction.boundaries[this.direction][0] && this.xpos < junction.boundaries[this.direction][1]){
                        hasCollision = 1;
                    }
                    break;
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
                    if(this.ypos - (this.actorheight / 2) < (0 - this.actorheight)){ //if the vehicle has gone off north, add to southern stack
                        this.ypos = canvas.height + this.actorheight;
                        addtostack = 1;
                    }
                    break;
                case 1: //east
                    this.xpos += this.moveby;
                    if(this.xpos - (this.actorwidth / 2) > canvas.width){
                        this.xpos = 0 - (this.actorwidth * 2);
                        addtostack = 1;
                    }
                    break;
                case 2: //south
                    this.ypos += this.moveby;
                    if(this.ypos - (this.actorheight / 2) > canvas.height){
                        this.ypos = 0 - (this.actorheight * 2);
                        addtostack = 1;
                    }
                    break;
                case 3: //west
                    this.xpos -= this.moveby;
                    if(this.xpos + (this.actorwidth / 2) < (0 - this.actorwidth)){
                        this.xpos = canvas.width + this.actorwidth;
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
            //slightly complicated now as we're making it minimum 320x320, maximum 600x600
            //fixme there's probably a simpler way of doing this
            canvas.width = Math.min(destwidth,Math.max(320,Math.min($(window).width(),aspect) - 2)); //shaving a bit off here to avoid a bit of vertical overlap
            canvas.height = Math.min(destheight,Math.max(320,(canvas.width / destwidth) * destheight - 2));
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
        //draw on the canvas
        drawOnCanvas: function(obj,sprite){
            canvas_cxt.drawImage(sprite, obj.spritex, obj.spritey, obj.spritewidth, obj.spriteheight, obj.xpos, obj.ypos, obj.actorwidth, obj.actorheight);
        },
        //draw some object on the canvas
        drawObjectOnCanvas: function(obj){
            var xpos = obj.xpos - (obj.actorwidth / 2);
            var ypos = obj.ypos - (obj.actorheight / 2);
            canvas_cxt.drawImage(obj.sprite, obj.spritex, obj.spritey, obj.spritewidth, obj.spriteheight, xpos, ypos, obj.actorwidth, obj.actorheight);
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
            data = data[0];
            level = new createLevel(data);
            
            for(i = 0; i < data['roads'].length; i++){
                if(data['roads'][i]){
                    level.sprites[i] = roadimages[i];
                }
            }
            
            //create and configure the junction
            junction = new createJunction();
            //fixme might do something more configurable for size and position in future
            junction.actorwidth = canvas.width / 2;
            junction.actorheight = canvas.height / 2;
            junction.xpos = canvas.width / 4;
            junction.ypos = canvas.width / 4;
            junction.sprite = roadimages[8];
            
            //this is going to get ugly fixme
            var boundary = 20;
            junction.boundaries[0] = [junction.ypos + junction.actorheight, junction.ypos + junction.actorheight + boundary]; //north
            junction.boundaries[1] = [junction.xpos, junction.xpos - boundary]; //east
            junction.boundaries[2] = [junction.ypos, junction.ypos - boundary]; //south
            junction.boundaries[3] = [junction.xpos + junction.actorwidth, junction.xpos + junction.actorwidth + boundary]; //west
        },
        //initialise data for the vehicles
        setupVehicles: function(){
            var data = vehicledata(canvas);
            var vehtmp;
            var vehid = 1;
            var spacing = 30;

            var vehiclecount,routecount = 0;
            vehiclecounts = [0,0,0,0];
            for(i = 0; i < level.routes.length; i++){ //count the number of routes
                if(level.routes[i])
                    routecount++;
            }

            //fixme this all seems too complicated. Isn't there a simpler way?
            if(!level.randomdist){ //evenly spread the total vehicles between the available routes
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

            var boundary_n = canvas.height / 6;
            var boundary_e = canvas.width / 6;
            var boundary_s = canvas.height / 6;
            var boundary_w = canvas.width / 6;
            var midpoint_ns = canvas.height / 2;
            var midpoint_ew = canvas.width / 2;
            var midpoints = [midpoint_ns, midpoint_ew, midpoint_ns, midpoint_ew]; //midpoints in a nesw accessible structure

            var xpos_north = canvas.width / 2.4; //left side of the road
            var xpos_south = canvas.width / 1.7; //right side of the road
            var ypos_east = canvas.height / 2.4; //left side of the road
            var ypos_west = canvas.height / 1.7; //right side of the road

            //used to place vehicles without overlapping them
            //essentially here we're defining a square ring around the screen within which vehicles can be placed depending on the level configuration
            //in order to prevent vehicles being placed too near the edge and/or in the middle of the junction where they could overlap
            //if the level has a junction in the middle fixme
            var directors_areas = [
                [boundary_n, boundary_n * 1.2, canvas.height - (boundary_n * 1.2), canvas.height - boundary_n], //north
                [boundary_e, boundary_e * 1.2, canvas.height - (boundary_e * 1.2), canvas.width - boundary_e], //east
                [boundary_s, boundary_s * 1.2, canvas.height - (boundary_s * 1.2), canvas.height - boundary_s], //south
                [boundary_w, boundary_w * 1.2, canvas.height - (boundary_w * 1.2), canvas.width - boundary_w], //west
            ];
            //console.log(directors_areas);

            var directors = [boundary_n,boundary_e,boundary_s,boundary_w]; //these are the positions we start placing vehicles from, then increment

            //remove 'gaps' as necessary, based on the level priorities. Note that to configure an empty junction we would set all priorities to zero
            for(i = 0; i < level.priority.length; i++){
                if(level.priority[i]){
                    directors_areas[i][1] = midpoints[i];
                    directors_areas[i][2] = midpoints[i];
                }
            }

            //now create and position the vehicles
            for(i = 0; i < vehiclecounts.length; i++){ //i is the direction of the vehicle, n,e,s,w
                for(y = 0; y < vehiclecounts[i]; y++){ //y is the number of the vehicles for each direction
                    vehtmp = new createVehicle(data[0]); //fixme will have different vehicles eventually
                    vehtmp.id = vehid++;
                    vehtmp.direction = i;
                    vehtmp.sprite = vehimages[i];
                    var tmppos;

                    //fixme argh we're redefining this in every loop
                    var directionvariables = [
                        [spacing, vehtmp.actorheight, canvas.height + vehtmp.actorheight], //n
                        [spacing, vehtmp.actorwidth,  0 - (vehtmp.actorwidth * 2)], //e
                        [spacing, vehtmp.actorheight, 0 - (vehtmp.actorheight * 2)], //s
                        [spacing, vehtmp.actorwidth,  canvas.width + (vehtmp.actorwidth * 2)] //w
                    ];

                    //select a position within the height or width of the page (depending on direction) as the start position
                    //set the other value of width or height based on the direction and side of the road it should be on
                    if(directors[vehtmp.direction] < directors_areas[i][3]){
                        if(directors[vehtmp.direction] > directors_areas[i][1] && directors[vehtmp.direction] < directors_areas[i][2]){
                            directors[vehtmp.direction] = directors_areas[i][2];
                        }
                        //tmppos = directors[vehtmp.direction] + directionvariables[i][0]; //Math.floor(getRandomArbitrary(directionvariables[i][2],directionvariables[i][2]));
                        tmppos = directors[vehtmp.direction] + Math.floor(getRandomArbitrary(directionvariables[i][0],directionvariables[i][0] * 1.5));
                        directors[vehtmp.direction] = tmppos + directionvariables[i][1];
                    }
                    else {
                        tmppos = directionvariables[i][2];
                        vehtmp.active = 0;
                        level.directionstacks[vehtmp.direction].push(vehtmp);
                    }
                    switch(i){
                        case 0: //north
                            vehtmp.xpos = xpos_north + getRandomArbitrary(0 - vehtmp.actorwidth / 14, vehtmp.actorwidth / 14);
                            vehtmp.ypos = tmppos;
                            break;
                        case 1: //east
                            vehtmp.xpos = tmppos;
                            vehtmp.ypos = ypos_east + getRandomArbitrary(0 - vehtmp.actorheight / 14, vehtmp.actorheight / 14);
                            break;
                        case 2: //south
                            vehtmp.xpos = xpos_south + getRandomArbitrary(0 - vehtmp.actorwidth / 14, vehtmp.actorwidth / 14);
                            vehtmp.ypos = tmppos;
                            break;
                        case 3: //west
                            vehtmp.xpos = tmppos;
                            vehtmp.ypos = ypos_west + getRandomArbitrary(0 - vehtmp.actorheight / 14, vehtmp.actorheight / 14);
                            break;
                    }
                    allObjects.push(vehtmp);
                }
            }
            /*
            // bit of debug stuff here
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
                junction.draw(); //draw junction
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
        //roadimages = preloadImages(roadimages,roadimgdir);
        //pedimages = preloadImages(pedimages,pedimgdir);
        //vehimages = preloadImages(vehimages,vehimgdir);
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
    
    $('body').on('keyup',function(e){
        if(e.keyCode == 49){ //1
            junction.changeLights();
        }
        /*
        if(e.keyCode == 50){ //2
            junction.changeLights(1);
        }
        */
    });

};