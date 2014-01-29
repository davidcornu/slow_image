'use strict';

var http = require('http');
var fs   = require('fs');
var path = require('path');

var port      = process.env.PORT || 3000;
var imgPath   = path.resolve(__dirname, './image.jpg');
var chunkSize = 10240; // 10KB
var waitTime  = 100; // ms

// Load the image into memory once 
var loadImgBuf = (function(){
  var imgBuf;

  return function(callback){
    if (imgBuf) return process.nextTick(function(){ callback(null, imgBuf) });

    fs.readFile(imgPath, function(err, buffer){
      if (err) return callback(err);
      imgBuf = buffer;
      callback(null, imgBuf);
    });
  };
})();

// Serve small chunks of the image, waiting in between each one
var server = http.createServer(function(req, res){
  loadImgBuf(function(err, imgBuf){
    if (err) {
      res.statusCode = 500;
      res.setHeader('content-type', 'text/plain');
      return res.end('An error occured');
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'image/jpeg');
    
    var imgLen = imgBuf.length;
    var curPos = 0;

    function feed(){
      if (curPos >= imgLen) return res.end();

      var nextPos = curPos + chunkSize;
      if (nextPos > imgLen) nextPos = imgLen;
      res.write(imgBuf.slice(curPos, nextPos));
      curPos = nextPos;
      
      setTimeout(feed, waitTime);
    }

    feed();
  });
});

server.listen(port, function(){
  console.log('Server listening on port %s', port);
});
