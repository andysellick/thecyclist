//load images
var roadimgdir = 'roads/';
var roadimages = ['dual-straight.png','dual-left.png','dual-left-tosingle.png','dual-right.png','dual-right-tosingle.png','dual-crossroads.png'];

var pedimgdir = 'peds/';
var pedimages = ['ped1.png'];

var vehimgdir = 'vehs/';
var vehimages = ['veh1.png'];

//preload all images
var loaders = [];
callAllImages(roadimages,roadimgdir);
callAllImages(pedimages,pedimgdir);
callAllImages(vehimages,vehimgdir);

function callAllImages(array,dir){
    for(i = 0; i < array.length; i++){
        loaders.push(loadSprite('static/img/' + dir + array[i]));
    }
}

//preload sprites
function loadSprite(src) {
    var deferred = $.Deferred();
    var sprite = new Image();
    sprite.onload = function() {
        deferred.resolve();
    };
    sprite.src = src;
    return deferred.promise();
}

//preload images
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

//FIXME split out road graphics into layers - tarmac, road markings, cycle boxes, lights


//function to return all the road information
function roaddata(canvas){
    //route-x attributes determine what kind of road goes in that direction
    //e.g. route-n 2 means a dual lane road goes north
    
    //routes shows the availability of directions of travel for nesw 
    //e.g. [2,0,2,1] is a two lane road going north and south and a single lane going west
    return([
        {
            'type': 'Dual lane, straight on',
            'img': roadimages[5],
            'width': canvas.width,
            'height': canvas.height,
            'vehcount': 8,
            'routes': [2,2,2,2],
            'junction': 0, //if 1, don't put any traffic in the centre zone
            'priority': 'ns', //determines which of the directions has priority and therefore can have traffic in the centre (assuming junction is 0)
        }
    ]);
}

function vehicledata(canvas){
    var vwidth = canvas.width / 8;
    var vheight = canvas.width / 8;

    return([
        {
            'type': '',
            'img': vehimages[0],
            'width': vwidth,
            'height': vheight,
        }
    ]);
}

