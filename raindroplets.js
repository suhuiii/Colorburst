var DropletArray = [];
var timer = 0;
var timestep = 1;
var rate = 90;
var spots = [];
var color_spread_radius = 50;
var color_leech_rate = 0.5;
var randomPixels = [];
var timerToRadians = 2 * Math.PI / 900;
var donePainting = false;
var pixelCounter = 0;
var new_x = 0;
var new_y = 0;
var debug = false;

function preload() {
  pixelDensity(1);
  if (debug || !navigator.onLine) {
    var your_image_filename = "default.jpg"  } else {
    var your_image_filename = "https://source.unsplash.com/random/" + windowWidth + "x" + windowHeight;
  }
  //var your_image_filename = "test.jpg";
  color_img = loadImage(your_image_filename);
  my_img = createImg(your_image_filename);
  my_img.size(windowWidth, windowHeight);
  my_img.style('z-index', '-1');
  my_img.style('position', '0');
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  image(color_img, 0, 0, windowWidth, windowHeight);
  filter(GRAY);
  var grayPix = get();

  pg = createGraphics(windowWidth, windowHeight);
  pg.image(grayPix, 0, 0, windowWidth, windowHeight);

  noFill();
  //image(color_img, 0, 0, windowWidth, windowHeight);
  //loadPixels();
  //console.log(pixels.length);
  //console.log(windowWidth + ", " + windowHeight);
  //window.color_pixels = pixels;

  pixelCounter = windowWidth * windowHeight;

  frameRate(30);

  // for (var i = 0; i < pixelCounter; i++) {
  //   randomPixels[i] = i;
  // }

  // randomPixels = shuffle(randomPixels);
}

//Each draw event clears the canvas and updates each Droplet
function draw() {
  //clear your palette, er, canvas;
  clear();

  switch(timer){
    case 0: rate = 80;
    case 100: rate = 70;
    case 250: rate = 60; break;
    case 500: rate = 30; break;
    case 720: rate = 10; break;
    case 800: rate = 5; break;
    case 1000: timestep = -1; break;

  }

  // create a new random droplet
  if (timer % rate === 0) {
    if (!donePainting) {
      new_x = Math.floor(random(windowWidth) / 4) * 4
      new_y = Math.floor(random(windowHeight) / 4) * 4;
    } else {

      while (true) {
        var randIndex = randomPixels[--pixelCounter];
        if (pixelCounter < 0) {
          donePainting = true;
          break;
        }
        if (pg.pixels[randIndex * 4] != window.pixels[randIndex * 4] || pg.pixels[randIndex * 4 + 1] != window.pixels[randIndex * 4 + 1] || pg.pixels[randIndex * 4 + 2] != window.pixels[randIndex * 4 + 2]) {
          break;
        }
      }

      var randXYArr = indexToSub(randIndex);
      new_x = randXYArr[0];
      new_y = randXYArr[1];
    }

    me = new Droplet(new_x, new_y);
    pushToArray(DropletArray, me);

    //only start coloring if this area has not already been colored (efficiency);
    if (!donePainting) {
      pushToArray(spots, [0, 0, new_x, new_y]);
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

  for (var index = 0; index < spots.length; index++) {
    if (spots[index] != undefined) {
      var radius = spots[index][0];
      var prev_radius = spots[index][1];
      var cent_x = spots[index][2];
      var cent_y = spots[index][3];

      if (radius < color_spread_radius) {
        paintCircle(radius, prev_radius, cent_x, cent_y);
        spots[index][1] = radius; // update prev_radius to current radius 
        spots[index][0] += color_leech_rate; // grow current radius by color_leech_rate
      }
      else {
        delete spots[index]; // delete circles from array if already at full size
      }
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


function paintCircle(radius, prev_radius, cent_x, cent_y) {
  //consider points for square centered at mouse position with size = radius of circle
  var sqRadius = sq(radius);
  var sqPrevRadius = sq(prev_radius);
  for (var y = floor(cent_y - radius); y < cent_y + radius; y++) {
    for (var x = floor(cent_x - radius); x < cent_x + radius; x++) {
      // some optimizations in painting of circles
      // - paint only if not already painted (i.e. alpha channel != 0)
      // - paint only new section of circle that has increased from previous circle  
      var thisIndex = subToIndex(x, y) * 4;
      sq_dist = sqDistFromCenter(cent_x, cent_y, x, y);
      if (sq_dist <= sqRadius && sq_dist >= sqPrevRadius) {
        // pg.pixels[thisIndex] = window.color_pixels[thisIndex];
        // pg.pixels[thisIndex + 1] = window.color_pixels[thisIndex + 1];
        // pg.pixels[thisIndex + 2] = window.color_pixels[thisIndex + 2];
        pg.pixels[thisIndex + 3] = 0;//window.color_pixels[thisIndex + 3];
      }
    }
  }

}
function sqDistFromCenter(center_x, center_y, x, y) {
  //this function returns the square distance of the x,y coordinate from the center
  square_dist = sq(center_x - x) + sq(center_y - y);
  return square_dist;
}
function subToIndex(x, y) {
  //this function returns an index value of the pixel array given an x,y coordinate
  return x + (windowWidth * y);
}

function indexToSub(index) {
  return [index % windowWidth, Math.floor(index / windowWidth)]
}

//Create a Droplet at Mouse location on click
function mousePressed() {
  var me = new Droplet(mouseX, mouseY);
  pushToArray(DropletArray, me);
  window.loc = (window.rowLength * mouseY) + (mouseX * 4);
  pushToArray(spots, [0, 0, mouseX, mouseY]);
}

//Droplet class
function Droplet(x, y) {
  var curr_wid = 0;
  var curr_hei = 0;
  var max_wid = 150;
  var finished = false;
  var echos = [];

  this.getX = function () {
    return x;
  }
  this.getY = function () {
    return y;
  }
  this.drip = function () {
    if (curr_wid < max_wid) {
      strokeWeight(2);
      stroke(255, max_wid - curr_wid);
      ellipse(x, y, curr_wid, curr_hei);
      curr_wid++;
      curr_hei++;
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

    this.echo = function () {
      if (curr_wid < max_wid) {
        stroke(0, max_wid - curr_wid);
        ellipse(x, y, curr_wid, curr_hei);
        curr_wid++;
        curr_hei++;
      }
      else if (last_echo == true) {
        return true;
      }
      return false;
    }
  }
}

function pushToArray(array, object) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] == undefined) {
      array[i] = object;
      return;
    }
  }
  array.push(object);
  return;
}

function multFour(num) {
  for (var i = 0; i < 4; i++) {
    if ((num + i) % 4 == 0) {
      return (num + i);
    }
  }
}