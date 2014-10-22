//load images
var roadimgdir = 'roads/';
var roadimages = ['route-n-1.png','route-n-2.png','route-e-1.png','route-e-2.png','route-s-1.png','route-s-2.png','route-w-1.png','route-w-2.png','junction-1.png'];

var pedimgdir = 'peds/';
var pedimages = ['ped1.png'];

var vehimgdir = 'vehs/';
var vehimages = ['veh_n.png','veh_e.png','veh_s.png','veh_w.png'];

//preload all images
var loaders = [];
callAllImages(roadimages,roadimgdir);
callAllImages(pedimages,pedimgdir);
callAllImages(vehimages,vehimgdir);

function callAllImages(array,dir){
    for(i = 0; i < array.length; i++){
        loaders.push(loadSprite('static/img/' + dir + array[i], array, i));
    }
}

//preload sprites
function loadSprite(src,array,num) {
    var deferred = $.Deferred();
    var sprite = new Image();
    sprite.onload = function() {
        deferred.resolve();
        array[num] = sprite;
    };
    sprite.src = src;
    return deferred.promise();
}

//preload images
/*
function preloadImages(array,dir){
    var imagedir = 'static/img/' + dir;
    var tempimg;
    for(i in array){
        tempimg = new Image();
        tempimg.src = imagedir + array[i];
        array[i] = tempimg;
    }
    return(array);
}
*/

//FIXME split out road graphics into layers - tarmac, road markings, cycle boxes, lights


//function to return all the road information
function roaddata(canvas){
    return([
        {
            'type': '', //currently unused
            'width': canvas.width,
            'height': canvas.height,
            'vehcount': 20,
            'randomdist': 0, //determines whether the number of cars is randomly distributed between the available routes or not
            'routes': [1,1,1,1], //determines which directions have traffic allowed in them, n,e,s,w.
            'roads': [1,1,1,1,1,1,1,1], //determines which directions have roads shown. Each direction has a pair of possible roads. THIS REQUIRES COMMON SENSE to configure
            'junction': 1, //fixme needs implementing. Possible values: 1 - traffic lights, 2 - traffic lights with cycle boxes
            'priority': [0,0,0,0], //determines which of the directions has priority and therefore can have traffic in the centre at the start, THIS REQUIRES COMMON SENSE to configure
        }
    ]);
}

function vehicledata(canvas){
    var vwidth = canvas.width / 10;
    var vheight = canvas.width / 10;

    return([
        {
            'type': 'car',
            //'img': vehimages[0], //currently unused
            'width': vwidth,
            'height': vheight,
        }
    ]);
}

