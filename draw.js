var fs = require('fs'),
  leftpad = require('leftpad'),
  projection = new (require('sphericalmercator'))(),
  Canvas = require('canvas'),
  csv = require('csv-parser');

var canvas = new Canvas(640, 640);
var ctx = canvas.getContext('2d');

var background = new Canvas.Image();
background.src = fs.readFileSync('./background.png');
ctx.drawImage(background, 0, 0);

fs.writeFileSync('frame.png', canvas.toBuffer());

var center = projection.px([
  -73.92562866210938,
  40.73360525899724], 11);

// The image is 640x640, so to get from the center
// to the top-left, we go up by half the width & height
var origin = [
  center[0] - 320,
  center[1] - 320
];

function positionToPixel(coord) {
  var px = projection.px(coord, 11);
  return [
    px[0] - origin[0],
    px[1] - origin[1]
  ];
}

ctx.fillStyle = '#84014b';
var frame = 0, perFrame = 100;
fs.createReadStream('trip_data_1.csv')
  .pipe(csv())
  .on('data', function(data) {
    var pixel = positionToPixel([
      parseFloat(data.pickup_longitude),
      parseFloat(data.pickup_latitude)]);
    ctx.fillRect(pixel[0], pixel[1], 2, 2);
    frame++;
    if (frame > 0 && frame % perFrame === 0) {
      // draw an image every time we've drawn 100 points.
      fs.writeFileSync('frames/' + leftpad(frame / perFrame, 5) + '.png',
        canvas.toBuffer());
      // and then draw, at a low opacity, the original static
      // map over it. this makes the points fade out.
      ctx.globalAlpha = 0.4;
      ctx.drawImage(background, 0, 0);
      ctx.globalAlpha = 1;
    }
  });
