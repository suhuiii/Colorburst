

var DropletArray = [];
var timer = 0;
var timestep = 1;
var rate = 90;
var spots = [];
var color_spread_radius = 50;
var color_leech_rate = 0.5;
// var your_image_filename = "https://unsplash.it/"+windowWidth+"/"+windowHeight+"/?random";

var timerToRadians = 2*Math.PI / 900;


function preload() {
  pixelDensity(1);
  var your_image_filename = "https://source.unsplash.com/random/" + windowWidth +"x"+ windowHeight;

    color_img = loadImage(your_image_filename);
  //color_img = loadImage("bend.jpg");
  //my_img = createImg("bend.jpg");
  my_img = createImg(your_image_filename);
  my_img.size(windowWidth,windowHeight);
  my_img.style('filter', 'grayscale(1)');
  my_img.style('z-index', '-1');
  my_img.style('position','0');
}

function setup() {
  canvas = createCanvas(windowWidth,windowHeight);
  pg = createGraphics(windowWidth, windowHeight);
  noFill();
  image(color_img, 0, 0, windowWidth, windowHeight);
  loadPixels();
  console.log(pixels.length);
  console.log(windowWidth + ", " + windowHeight);
  window.color_pixels = pixels;
  window.rowLength = windowWidth*4;
  window.columnLength = windowHeight*pixelDensity();
  //this is the size of the pixel array.
  window.pixel_len = window.rowLength * window.columnLength;
  console.log(window.pixel_len);
 frameRate(30);
  
}

//Each draw event clears the canvas and updates each Droplet
function draw() {
  //clear your palette, er, canvas;
  clear();
      
  //increase pace of rain: manual version
  if(timer == 360) {
    rate = 60;
  }
  if(timer == 450){
    rate = 60;
    if(timestep == -1) {
      color_spread_radius = 100;
        }
  }
  if(timer == 690) {
    rate = 30;
  }
  if(timer == 720){
    rate = 10;
  }
  if(timer == 750) {
    rate = 4;
  }
  if(timer == 1000) {
    timestep = -1;
  }
  if((timer == 0 & timestep == -1)) {
    //reverse pacing
    timestep = 0;
  }
  
  //************Fitting pace of rain to mathematical functions**************
  //https://www.wolframalpha.com/input/?i=y+%3D+(1-cos((x+%2B+8pi)%2F8)+*+90
  // 1 - cos() approach:
  /*
  if (timer % 4 == 0) {
  var xRad = timerToRadians * timer;
  rate = floor( ( 1 - cos((xRad + ( 4*PI )) / 4) ) * 85) + 10;
  }
  */
  
  //logistic approach. Note: screw all of these. 
  //too computationally expensive and also not as good
  //looking as manual controller.
  /*
  rate = floor( 180 / (1 + exp(-1 * ((timer - 450)/450))));
  console.log(rate);
  console.log((exp(-1 * (timer - 10))));
  */
  //***********************************************************************
  
  //create a new random droplet
  if (timer % rate === 0) {
    
    var new_x = Math.floor(random(windowWidth)/4)*4
    var new_y = Math.floor(random(windowHeight)/4)*4;
    me = new Droplet(new_x, new_y);
    pushToArray(DropletArray, me);
    
    //this is the index of the pixel to color in the image's pixel array
    window.loc = (window.rowLength*new_y) + (new_x*4);
    
    //only start coloring if this area has not already been colored (efficiency);
    if (pg.pixels[window.loc] != pixels[window.loc]) {
      pushToArray(spots, [window.loc, 0]);
    }
  }
  
  timer += timestep;
  
  //*************On the off-screen graphics buffer 'pg', color in a*********** 
  //***************circle of pixels at (x,y) from the color image.************
 
  pg.loadPixels();
  
  //find surrounding pixels in a square with radius 4 - recall each 
  //pixel has its info stored in 4 consecutive array cells;
  // LUL THE 'A' IN RGBA STANDS FOR ALPHA AS IN ALPHA CHANNEL...TRANSPARENCY
  // GO ahead and make this code much more efficient if you want by just laying the
  // color image on top of the gray image and changing the alpha channel value... 
  // but I'm done with this for now.
  
  //Colors in the pixels of a circle surrounding the origin of a droplet.
  //The radius to be filled in increases with each timestep by color_leech_rate, so that 

  for (var ind = 0; ind < spots.length; ind++) {
    if(spots[ind] != undefined) {
      var loc = spots[ind][0];
      var radius = spots[ind][1];
      if (radius < color_spread_radius) {
      for (var i = 0; i < radius; i++) {
        var top = loc - rowLength*(i);
        var bottom = loc + rowLength*(i);

        //bound the pixels within the array.
        if (top - 4*radius < 0) {
          top = 0;
        }
        else if (top > window.pixel_len) {
          top = window.pixel_len;
        }
        if (bottom < 0) {
          bottom = 0;
        }
        else if (bottom + 4*radius > window.pixel_len) {
          bottom = window.pixel_len;
        }

        //calculatehowmanypixelsacross
        //r^2=(x-x0)^2+(y-y0)^2
        var off = floor(sqrt( sq(radius) - sq(i) ))*4;


        //copy over only the outer pixels (presumably the inner pixels have been filled by the previous
        //iterations of the draw function. Note there is currently a little bit of a problem here
        //due to rounding... I think.)
        for (var count = 0; count < 4; count++) {
          pg.pixels[top - off + count] = window.color_pixels[top - off + count];
          pg.pixels[top + off + count] = window.color_pixels[top + off + count];
          pg.pixels[bottom - off + count] = window.color_pixels[bottom - off + count];
          pg.pixels[bottom + off + count] = window.color_pixels[bottom + off + count];
        }
      }
      spots[ind][1] += color_leech_rate;

      }
    }
    else {
      delete spots[ind];
    }
  }
    //pg.updatePixels() loads the pixel array into the graphics buffer. Image()
    //loads the graphics buffer pg onto the main canvas.
    pg.updatePixels();
    image(pg, 0, 0);
 
  //updates droplets.
  for (var i = 0; i < DropletArray.length; i++) {
    if (DropletArray[i] != undefined) {
      var finished = DropletArray[i].drip();   
      if (finished) {
        delete DropletArray[i];
      }
    }
  }
}

//Create a Droplet at Mouse location on click
function mousePressed() {
    var me = new Droplet(mouseX, mouseY);
    pushToArray(DropletArray, me);
  window.loc = (window.rowLength*mouseY) + (mouseX*4);
    pushToArray(spots, [window.loc, 0]);
}

//Droplet class
function Droplet(x, y) {
var curr_wid = 0;
var curr_hei = 0;
var max_wid = 150;
var finished = false;
var echos = [];

this.getX = function() {
  return x;
}
this.getY = function() {
  return y;
}
this.drip = function() {
  if (curr_wid < max_wid) {
    strokeWeight(2);
    stroke(255, max_wid - curr_wid);
    ellipse(x, y, curr_wid, curr_hei);
    curr_wid ++;
    curr_hei ++;
  }
    
  //Create secondary perturbations at certain points...
  if (curr_wid == 10) {
    var my_echo = new Echo(x, y, max_wid, false);
    echos.push(my_echo);
  }
  if (curr_wid == 20) {
    var my_echo = new Echo(x, y, max_wid, false);
    echos.push(my_echo);
  }
  
  if (curr_wid == 70) {
    var my_echo = new Echo(x, y, 100, false);
    echos.push(my_echo);
  }
  if (curr_wid == 80) {
    var my_echo = new Echo(x, y, 100, false);
    echos.push(my_echo);
  }
  /*
  if (curr_wid == 140) {
    var my_echo = new Echo(x, y, max_wid, false);
    echos.push(my_echo);
  }
  if (curr_wid == 145) {
    var my_echo = new Echo(x, y, max_wid, false);
    echos.push(my_echo);
  }
  if (curr_wid == 180) {
    var my_echo = new Echo(x, y, max_wid, false);
    echos.push(my_echo);
  }
  if (curr_wid == 190) {
    var my_echo = new Echo(x, y, max_wid, false);
    echos.push(my_echo);
  }
  if (curr_wid == 195) {
    var my_echo = new Echo(x, y, max_wid, true);
    echos.push(my_echo);
  }
  */
  for (var i = 0; i < echos.length; i++) {
    var echo_done = echos[i].echo();
    if (echo_done == true) {
      finished = true;
    }
  }
  return finished;
}

//Echo class - similar to Droplet, except creates no secondary perturbations
function Echo(x, y, max_wid, last_echo) {
  var curr_wid = 0;
  var curr_hei = 0;
  
  this.echo = function() {
    if (curr_wid < max_wid) {
      stroke(0, max_wid - curr_wid);
      ellipse(x, y, curr_wid, curr_hei);
      curr_wid ++;
      curr_hei ++;
    }
    else if (last_echo == true) {
      return true;
    }
    return false;
  }
}
}

function pushToArray(array, object) {
  for(var i = 0; i < array.length; i++) {
    if(array[i] == undefined) {
        array[i] = object;
      return;
    }
  }
  array.push(object);
  return;
}

function multFour(num) {
  for(var i = 0; i < 4; i++) {
    if((num + i) % 4 == 0) {
      return (num+i);
    }
  }
}