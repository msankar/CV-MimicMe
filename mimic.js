// Mimic Me!
// Fun game where you need to express emojis being displayed

// --- Affectiva setup ---

// The affdex SDK Needs to create video and canvas elements in the DOM
var divRoot = $("#camera")[0];  // div node where we want to add these elements
var width = 640, height = 480;  // camera image size
var faceMode = affdex.FaceDetectorMode.LARGE_FACES;  // face mode parameter

// Initialize an Affectiva CameraDetector object
var detector = new affdex.CameraDetector(divRoot, width, height, faceMode);

// Enable detection of all Expressions, Emotions and Emojis classifiers.
detector.detectAllEmotions();
detector.detectAllExpressions();
detector.detectAllEmojis();
detector.detectAllAppearance();

// --- Utility values and functions ---

// Unicode values for all emojis Affectiva can detect
var emojis = [ 128528, 9786, 128515, 128524, 128527, 128521, 128535, 128539, 128540, 128542, 128545, 128563, 128561 ];
var currentScore = 0;
var totalScore = 0;
var timeleft = 0;
var timer = 0;
var targetEmoji = 0;

// Update target emoji being displayed by supplying a unicode value
function setTargetEmoji(code) {
  $("#target").html("&#" + code + ";");
}

// Convert a special character to its unicode value (can be 1 or 2 units long)
function toUnicode(c) {
  if(c.length == 1)
    return c.charCodeAt(0);
  return ((((c.charCodeAt(0) - 0xD800) * 0x400) + (c.charCodeAt(1) - 0xDC00) + 0x10000));
}

// Update score being displayed
function setScore(correct, total) {
  $("#score").html("Score: " + correct + " / " + total);
}

// Display log messages and tracking results
function log(node_name, msg) {
  $(node_name).append("<span>" + msg + "</span><br />")
}

// --- Callback functions ---

// Start button
function onStart() {
  if (detector && !detector.isRunning) {
    $("#logs").html("");  // clear out previous log
    detector.start();  // start detector
  }
  log('#logs', "Start button pressed");
}

// Stop button
function onStop() {
  log('#logs', "Stop button pressed");
  if (detector && detector.isRunning) {
    detector.removeEventListener();
    detector.stop();  // stop detector
  }
  stopGame();
};

// Reset button
function onReset() {
  log('#logs', "Reset button pressed");
  if (detector && detector.isRunning) {
    detector.reset();
  }
  $('#results').html("");  // clear out results
  $("#logs").html("");  // clear out previous log

  // TODO(optional): You can restart the game as well
  restartGame();
};

// Add a callback to notify when camera access is allowed
detector.addEventListener("onWebcamConnectSuccess", function() {
  log('#logs', "Webcam access allowed");
});

// Add a callback to notify when camera access is denied
detector.addEventListener("onWebcamConnectFailure", function() {
  log('#logs', "webcam denied");
  console.log("Webcam access denied");
});

// Add a callback to notify when detector is stopped
detector.addEventListener("onStopSuccess", function() {
  log('#logs', "The detector reports stopped");
  $("#results").html("");
});

// Add a callback to notify when the detector is initialized and ready for running
detector.addEventListener("onInitializeSuccess", function() {
  log('#logs', "The detector reports initialized");
  //Display canvas instead of video feed because we want to draw the feature points on it
  $("#face_video_canvas").css("display", "block");
  $("#face_video").css("display", "none");

  // TODO(optional): Call a function to initialize the game, if needed
  initializeGame();
});

// Add a callback to receive the results from processing an image
// NOTE: The faces object contains a list of the faces detected in the image,
//   probabilities for different expressions, emotions and appearance metrics
detector.addEventListener("onImageResultsSuccess", function(faces, image, timestamp) {
  var canvas = $('#face_video_canvas')[0];
  if (!canvas)
    return;

  // Report how many faces were found
  $('#results').html("");
  log('#results', "Timestamp: " + timestamp.toFixed(2));
  log('#results', "Number of faces found: " + faces.length);
  if (faces.length > 0) {
    // Report desired metrics
    log('#results', "Appearance: " + JSON.stringify(faces[0].appearance));
    log('#results', "Emotions: " + JSON.stringify(faces[0].emotions, function(key, val) {
      return val.toFixed ? Number(val.toFixed(0)) : val;
    }));
    log('#results', "Expressions: " + JSON.stringify(faces[0].expressions, function(key, val) {
      return val.toFixed ? Number(val.toFixed(0)) : val;
    }));
    log('#results', "Emoji: " + faces[0].emojis.dominantEmoji);

    // Call functions to draw feature points and dominant emoji (for the first face only)
    drawFeaturePoints(canvas, image, faces[0]);
    drawEmoji(canvas, image, faces[0]);

    // TODO: Call your function to run the game (define it first!)
    mimicEmoji(faces[0]);
  }
});


// --- Custom functions ---

// Draw the detected facial feature points on the image
function drawFeaturePoints(canvas, img, face) {
  // Obtain a 2D context object to draw on the canvas
  var ctx = canvas.getContext('2d');

  // TODO: Set the stroke and/or fill style you want for each feature point marker
  // See: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D#Fill_and_stroke_styles
  ctx.fillStyle = 'yellow';
  
  // Loop over each feature point in the face
  for (var id in face.featurePoints) {
    var featurePoint = face.featurePoints[id];

    // TODO: Draw feature point, e.g. as a circle using ctx.arc()
    // See: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/arc
    ctx.beginPath();
    // void ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
    ctx.arc(featurePoint.x,featurePoint.y, 2, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// Draw the dominant emoji on the image
function drawEmoji(canvas, img, face) {
  // Obtain a 2D context object to draw on the canvas
  var ctx = canvas.getContext('2d');

  // TODO: Set the font and style you want for the emoji
  //https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_text
  ctx.font = '56px serif';
  
  // TODO: Draw it using ctx.strokeText() or fillText()
  // See: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText
  // TIP: Pick a particular feature point as an anchor so that the emoji sticks to your face
  var featurept = 3;
  dominantEmoji = face.emojis.dominantEmoji;
  ctx.fillText(dominantEmoji, face.featurePoints[featurept].x, face.featurePoints[featurept].y);
}

// TODO: Define any variables and functions to implement the Mimic Me! game mechanics

// NOTE:
// - Remember to call your update function from the "onImageResultsSuccess" event handler above
// - You can use setTargetEmoji() and setScore() functions to update the respective elements
// - You will have to pass in emojis as unicode values, e.g. setTargetEmoji(128578) for a simple smiley
// - Unicode values for all emojis recognized by Affectiva are provided above in the list 'emojis'
// - To check for a match, you can convert the dominant emoji to unicode using the toUnicode() function

// Optional:
// - Define an initialization/reset function, and call it from the "onInitializeSuccess" event handler above
// - Define a game reset function (same as init?), and call it from the onReset() function above

// <your code here>

function initializeGame() {
  var delay = 9000; //Wait 9s for initialization.
  var startDateTime = new Date().getTime();
  while (new Date().getTime() < startDateTime + delay);

  currentScore = 0; //# of emojis successfully mimiced by player
  totalScore = 0; //Total # of emojis displayed to player
  setScore(currentScore,totalScore);
  timeleft = 10;  // 10 seconds to mimic an emoji
  //setInterval(function(){ alert("Hello"); }, 3000);
  timer = setInterval(countDown(), 2000); //Timer to indicate the time left to mimic
  targetEmoji = 0;
  showRandomEmoji();  // Show a random emoji
}

function mimicEmoji(face) {
  if (toUnicode(face.emojis.dominantEmoji) == targetEmoji){
    currentScore++; // Increment correct score
    setScore(currentScore,totalScore) //Display new score
    if(timer){
      clearInterval(timer);  // Stop the timer
    }
    timeleft = 10;
    timer = setInterval(countDown(), 2000)
    showRandomEmoji();  
  }
}

function showRandomEmoji(){
  var emojiIdx = Math.floor(Math.random()*13); //Random emoji to display
  targetEmoji = emojis[emojiIdx];    // target emoji to show
  setTargetEmoji(targetEmoji);       // SHow target Emoji
  totalScore++;                      //Increment the total emojis shown
  setScore(currentScore,totalScore); //Display score.
}

function restartGame() {
  currentScore = 0;
  totalScore = 0;
  setScore(currentScore,totalScore); 
  if (timer > 0) {
    clearInterval(timer);
  } 
  timeleft =10;
  timer = setInterval(countDown(), 1000);
  targetEmoji = 0;
  showRandomEmoji();
}

function stopGame() {
  if (timer > 0) {
    clearInterval(timer);
  } 
  currentScore = 0;
  totalScore = 0;
  timeleft = 0;
  timer = 0;
  targetEmoji = 0;
  setTargetEmoji(targetEmoji); 
  setScore(currentScore,totalScore); 
}

function countDown() {
  timeleft--;
  if(timeleft == 0){
    timeleft = 10;
    showRandomEmoji();
  }
}
