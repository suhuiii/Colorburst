# Colorburst
A Chrome Extension for New Tabs
- Replaces tab with a background image taken from [Unsplash](www.unsplash.com).  
- Background image starts off _greyscale_ and is gradually __colored__ with simulate rainfall.  
- Includes a weather widget powered by [Dark Sky](www.darksky.net) 

Made at the [Recurse Center](www.recurse.com) with [Ryan Yan](https://github.com/apsicle).

#### Demo Images
![Coloring a car](/demo-images/colorburst-car.gif?raw=true)

![Coloring some camels](/demo-images/colorburst-camel.gif?raw=true)

## Installation and Usage
As of this writing, extension is in _fully working beta_ but has not been published on Chrome Store.  
To try it out on your chrome browser, download the folder and follow the instructions [here](https://developer.chrome.com/extensions/getstarted#unpacked)

## Background 
This project resulted from some [experimental sketches on OpenProcessing](https://www.openprocessing.org/sketch/397165).  
Code in this project features improvements in how images get colored and how circles are drawn.

### Libraries and tools used
- [P5.js](http://p5js.org/)
- [Dark Sky API](https://darksky.net/dev/)
- [Skycons](https://darkskyapp.github.io/skycons/)
- [Unsplash](https://source.unsplash.com/)

### Permissions
Permissions required on Google Chrome
1. active tab - replaces new tab
2. geolocation - to power Dark Sky widget

