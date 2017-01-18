var DropletArray = [];
var timer = 0;
var timestep = 1;
var rate = 90;
var spots = [];
var color_spread_radius = 50;
var color_leech_rate = 0.5;
var randomPixels = [];
var donePainting = false;
var pixelCounter = 0;
var new_x = 0;
var new_y = 0;
var debug = false;
var weatherJSON;
skycons = new Skycons({ "color": "#020202" });

function preload() {
  pixelDensity(1);

  //use default picture for debugging and if offline
  if (!navigator.onLine || debug) {
    var your_image_filename = "../img/default.jpg"
  } else {
    updateWeather();
    var your_image_filename = "https://source.unsplash.com/random/" + floor(windowWidth) + "x" + floor(windowHeight);
  }
  //get a new update every 10 mins
  setInterval(updateWeather, 600000);

  //image that is colored in
  img = loadImage(your_image_filename);
  //image that is in background and gradually exposed
  bg_img = createImg(your_image_filename);
  bg_img.size(windowWidth, windowHeight);
  bg_img.style('z-index', '-1');
  bg_img.style('position', '0');


}

function setup() {
  //filter function does not work on graphics buffer
  //workaround by drawing image on main canvas, filter it to greyscale and copying the pixels.
  canvas = createCanvas(windowWidth, windowHeight);
  image(img, 0, 0, windowWidth, windowHeight);
  filter(GRAY);
  loadPixels();
  var grayPix = get();

  //load greyscale image onto graphics buffer.
  pg = createGraphics(windowWidth, windowHeight);
  pg.image(grayPix, 0, 0, windowWidth, windowHeight);
  noFill();

  frameRate(30);

  //create an array of random pixels which we can use to progressively color in the image
  //ensures that whole image gets colored in rather than checking random points to see if it has been colored. 
  pixelCounter = windowWidth * windowHeight;
  for (var i = 0; i < pixelCounter; i++) {
    randomPixels[i] = i;
  }
  randomPixels = shuffle(randomPixels);
}

//Each draw event clears the canvas and updates each Droplet
function draw() {

  //clear canvas
  clear();

  switch (timer) {
    case 0: rate = 10; timestep = 1; break;
    case 100: rate = 30; break;
    case 250: rate = 50; break;
    case 500: rate = 30; break;
    case 720: rate = 10; break;
    case 800: rate = 5; break;
    case 1000: timestep = -1; break;

  }

  // get an X,Y coordinate
  if (timer % rate === 0) {
    if (donePainting) {
      //whole area is painted, so doesn't matter what is picked
      new_x = Math.floor(random(windowWidth) / 4) * 4
      new_y = Math.floor(random(windowHeight) / 4) * 4;
    } else {
      //otherwise, loop through array of random pixels and find one that hasn't been painted
      while (true) {
        var randIndex = randomPixels[--pixelCounter];
        if (pixelCounter < 0) {
          donePainting = true;
          break;
        }
        //Each index location translates to 4 channels for RGBA. 
        //Here we are checking the A channel to see if it is set to 0 (transparent)
        if (pg.pixels[randIndex * 4 + 3] != 0) {
          break;
        }
      }

      var randXYArr = indexToSub(randIndex);
      new_x = randXYArr[0];
      new_y = randXYArr[1];
    }

    //create a new Droplet(wave) and/or Spot(colored area)
    me = new Droplet(new_x, new_y);
    pushToArray(DropletArray, me);

    if (!donePainting) {
      //color spot only if not done painting.
      pushToArray(spots, [0, 0, new_x, new_y]);
    }
  }

  timer += timestep;

  //*************On the off-screen graphics buffer 'pg', color in a*********** 
  //***************circle of pixels at (x,y) from the color image.************

  pg.loadPixels();

  //paint a circle for each spot if they are not at full size
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
  if (!donePainting) {
    pg.updatePixels();
    image(pg, 0, 0);
  }

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
      // - paint only new section of circle that has increased from previous circle. i.e. rings from the center
      var thisIndex = subToIndex(x, y) * 4;
      sq_dist = sqDistFromCenter(cent_x, cent_y, x, y);
      if (sq_dist <= sqRadius && sq_dist >= sqPrevRadius) {
        //make A channel 0 (transparent).
        pg.pixels[thisIndex + 3] = 0;
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
  //this function returns a x,y coordinate given an index value.
  return [index % windowWidth, Math.floor(index / windowWidth)]
}

//Create a Droplet at Mouse location on click
function mousePressed() {
  var me = new Droplet(mouseX, mouseY);
  pushToArray(DropletArray, me);

  pushToArray(spots, [0, 0, mouseX, mouseY]);
}

//Droplet class
function Droplet(x, y) {
  var curr_wid = 0;
  var curr_hei = 0;
  var max_wid = 100;
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
      stroke(180, max_wid - curr_wid);
      ellipse(x, y, curr_wid, curr_hei);
      curr_wid++;
      curr_hei++;
    }

    switch (curr_wid) {
      case 10:
      case 25: var my_echo = new Echo(x, y, max_wid, false);
        echos.push(my_echo);
        break;
      case 50:
      case 70: var my_echo = new Echo(x, y, 100, false);
        echos.push(my_echo);
    }

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

function updateWeather() {
  if (navigator.onLine) {
    console.log(hour() + ":" + minute() + " - getting new weather update...");
    navigator.geolocation.getCurrentPosition(function (position) {
      weatherJSON = loadJSON("https://api.darksky.net/forecast/fb84b7be987050c793dd703b0410d867/" + position.coords.latitude + "," + position.coords.longitude + "?exclude=minutely,hourly,daily,alerts");
      setTimeout(updateWeatherWidget, 1000);
    });

  }
}

function updateWeatherWidget() {
  if (weatherJSON) {
    document.getElementById("topRight").style.visibility = 'visible';
    var re = /(\w+)\/(\w+)/;
    var loc = weatherJSON["timezone"].replace(re, '$2');
    locationlabel.textContent = loc.replace("_", " ");
    tempNumber.textContent = weatherJSON["currently"]["temperature"] + "°";
    tempUnits.textContent = weatherJSON["flags"]["units"] == "si" ? "C" : "F";
    skycons.add("weathericon", weatherJSON["currently"]["icon"]);
    skycons.play();
  }
}