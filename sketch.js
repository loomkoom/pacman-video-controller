let pacman;
let grid = [];
let rows, cols;
const w = 25; //cell length (standard w = 10)
const cnvWidth = 26 * w;
const cnvHeight = 20 * w;
let speedX = 0;
let speedY = 0;
let totalScore = 0;
let p;
let ghosts = [];
let ghostNum = 4;
let r;
let thetaoff = 0;
let dir; //equals 0 if up , 1 if right , 2 if down , 3 if left.
let neighbors = [];
var classifier;
var imageModelURL = "https://teachablemachine.withgoogle.com/models/ilW8m9znX/";
var video;
var flippedImage;
var camWidth = 320;
var camHeight = 260;
var label = {};
var labelName = "";
var labelConfidence = 0;
var confidenceTresh = 50;
const FRAMERATE = 20;



function preload() {
    classifier = ml5.imageClassifier(imageModelURL + "model.json");
}

function setup() {
    frameRate(FRAMERATE);
    let cnv = createCanvas(cnvWidth + camWidth, cnvHeight);
    cnv.parent("cnv");

    // Create the video / webcam stream
    video = createCapture(VIDEO);
    video.size(camWidth, camHeight);
    video.hide();
    // Start classifying
    classifyImage();

    resetGame();
    let button = createButton("reset");
    button.mousePressed(resetGame);
    button.parent("cnv");
    button.position(cnvWidth / 2 - 50, cnvHeight);

    let div = select("#buttons");
    div.parent("cnv");
    div.position(
        cnvWidth + (camWidth * 3) / 5,
        cnvHeight - (cnvHeight - camHeight) / 2
    );
}

function draw() {
    background(0);

    image(flippedImage, cnvWidth + w / 2, (cnvHeight - camHeight) / 2);

    // Draw the label (label is already declaired as a variable, and given content in the gotResult() function
    fill(255);
    textSize(30);
    textAlign(CENTER);
    text(
        labelName,
        cnvWidth + camWidth / 3,
        cnvHeight - (cnvHeight - camHeight) / 4 - 10
    );
    text(
        labelConfidence,
        cnvWidth + camWidth / 3,
        cnvHeight - (cnvHeight - camHeight) / 4 + 20
    );

    for (div of select("#buttons").elt.children) {
        div.style.filter = "grayscale(90%) opacity(65%)";
    }

    if (labelName == "X") {
        let div = select("#x");
        div.style("filter", "opacity(100%) drop-shadow(0px 0px 5px blue)");
    } else if (labelName == "B") {
        let div = select("#b");
        div.style("filter", "opacity(100%) drop-shadow(0px 0px 5px red)");
    } else if (labelName == "Y") {
        let div = select("#y");
        div.style("filter", "opacity(100%) drop-shadow(0px 0px 5px yellow)");
    } else if (labelName == "A") {
        let div = select("#a");
        div.style("filter", "opacity(100%) drop-shadow(0px 0px 5px green)");
    }

    //score
    textSize(40);
    fill(255);
    strokeWeight(8);
    stroke(150, 100);
    text('Score:  ' + totalScore, cnvWidth + camWidth / 2, 50);
    strokeWeight(0);
    stroke(0);

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            grid[i][j].show();
            grid[i][j].total();
        }
    }
    pacman.show();
    pacman.move();
    ghosts[0].show(0, 255, 0);
    ghosts[1].show(255, 25, 140);
    ghosts[2].show(255, 15, 0);
    ghosts[3].show(50, 155, 255);
    for (let i = 0; i < ghostNum; i++) {
        ghosts[i].move();
        ghosts[i].kill();
    }
    if (win()) {
        push();
        fill(205, 205, 40);
        stroke(5);
        text("YOU WON!", 0, height / 2);
        setTimeout(noLoop, 100);
        pop();
    }
}

function resetGame() {
    rectMode(CENTER);
    noStroke();
    textSize(w * 5);
    rows = height / w + 1;
    cols = (width - camWidth) / w + 1;
    translate(w / 2, w / 2);
    for (let i = 0; i < rows; i++) {
        grid[i] = [];
        for (let j = 0; j < cols; j++) {
            grid[i][j] = new Cell(w * (j + 0), w * (i + 0));
        }
    }
    for (let i = 0; i < ghostNum; i++) {
        let rx = round(random(11, 15));
        let ry = round(random(9, 11));
        ghosts[i] = new Ghost(w * rx, w * ry, w);
    }
    totalScore = 0;

    pacman = new Pacman(13 * w, 15 * w, w);
    speedX = 0;
    speedY = 0;
    dir = 0;
    level1();
    loop();
}

function classifyImage() {
    flippedImage = ml5.flipImage(video);
    classifier.classify(flippedImage, gotResult);
}

function gotResult(error, results) {
    if (error) {
        console.error(error);
        return;
    }
    //console.log(results);

    label = results[0];
    labelName = label.label;
    labelConfidence = ceil(label.confidence * 100);
    //print(labelConfidence)
    if (labelConfidence > confidenceTresh) {
        control(labelName);
    }
    classifyImage();
}

class Pacman {
    constructor(x, y, diameter) {
        this.x = x;
        this.y = y;
        this.d = diameter;
    }

    show() {
        fill(220, 220, 50);
        let theta = (PI / 3) * sq(sin(thetaoff));
        if (speedY < 0) {
            arc(
                this.x,
                this.y,
                this.d,
                this.d,
                -theta - PI / 6,
                theta + (7 * PI) / 6
            );
        } else if (speedY > 0) {
            arc(
                this.x,
                this.y,
                this.d,
                this.d,
                (-7 * PI) / 6 - theta,
                theta + PI / 6
            );
        } else if (speedX < 0) {
            arc(this.x, this.y, this.d, this.d, theta + PI, -theta + PI);
        } else if (speedX > 0) {
            arc(this.x, this.y, this.d, this.d, theta, -theta);
        } else {
            if (dir == 0) {
                arc(
                    this.x,
                    this.y,
                    this.d,
                    this.d,
                    -theta - PI / 6,
                    theta + (7 * PI) / 6
                );
            } else if (dir == 1) {
                arc(
                    this.x,
                    this.y,
                    this.d,
                    this.d,
                    (-7 * PI) / 6 - theta,
                    theta + PI / 6
                );
            } else if (dir == 2) {
                arc(this.x, this.y, this.d, this.d, theta + PI, -theta + PI);
            } else if (dir == 3) {
                arc(this.x, this.y, this.d, this.d, theta, -theta);
            } else {
                arc(this.x, this.y, this.d, this.d, theta, -theta);
            }
        }
        thetaoff += 0.1;
    }

    move() {
        checkNeighbors(this.x, this.y, neighbors);
        if (this.y % w == 0 && this.x % w == 0) {
            if (neighbors[3] || neighbors[1]) {
                speedX = 0;
            }
            if (neighbors[0] || neighbors[2]) {
                speedY = 0;
            }
            if (dir == 2 && neighbors[3] == false) {
                speedX = -w / 10;
                speedY = 0;
            }
            if (dir == 3 && neighbors[1] == false) {
                speedX = w / 10;
                speedY = 0;
            }
            if (dir == 0 && neighbors[0] == false) {
                speedY = -w / 10;
                speedX = 0;
            }
            if (dir == 1 && neighbors[2] == false) {
                speedY = w / 10;
                speedX = 0;
            }
        }
        this.x += speedX;
        this.y += speedY;
        //looping the pacman through the canvas
        if (this.x < -w / 2) {
            this.x = width - camWidth + w / 2;
        }
        if (this.x > width - camWidth + w / 2) {
            this.x = -w / 2;
        }
        if (this.y < -w / 2) {
            this.y = height + w / 2;
        }
        if (this.y > height + w / 2) {
            this.y = -w / 2;
        }
    }
}

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.wall = false; //is this cell a wall?
        this.score = false; //this cell increases the total score?
        this.power = false; // is this cell a power token?
        this.time = 0;
    }

    show() {
        if (this.wall == true) {
            fill(150, 100);
            rect(this.x, this.y, w, w);
            this.score = false;
        } else if (this.score) {
            fill(225, 120, 0);
            ellipse(this.x, this.y, w / 5);
        }
        if (this.power) {
            fill(225, 120, 0);
            if (this.time % 45 < 15) {
                fill(0);
            }
            ellipse(this.x, this.y, w / 2);
            this.time++;
            if (this.time == 4500) {
                this.time = 0;
            }
        }
    }

    total() {
        if (this.score) {
            let d = dist(pacman.x, pacman.y, this.x, this.y);
            if (d < w / 2) {
                totalScore++;
                this.score = false;
            }
        }
        if (this.power) {
            let d = dist(pacman.x, pacman.y, this.x, this.y);
            if (d < w / 2) {
                totalScore++;
                let time = 6000;
                this.power = false;
                for (let i = 0; i < ghostNum; i++) {
                    ghosts[i].killable = true;
                    setTimeout(ghostInv, time);
                }
            }
        }
    }
}

class Ghost {
    constructor(x, y, diameter) {
        this.i = 0;
        this.x = x;
        this.y = y;
        this.d = diameter;
        this.r1 = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.killable = false;
        this.alive = true;
        this.neighbors = [];
        this.i++;
    }

    show(r, g, b) {
        if (this.alive == false) {} else if (this.killable) {
            fill(0, 0, 255);
            ellipse(this.x, this.y, this.d, this.d);
            rect(this.x, this.y + w / 4, this.d, this.d / 2, 3);
        } else {
            fill(r, g, b);
            ellipse(this.x, this.y, this.d, this.d);
            rect(this.x, this.y + w / 4, this.d, this.d / 2, 3);
        }
        //eyes
        fill("black");
        ellipse(this.x + this.d / 3, this.y - 5, this.d / 6, this.d / 6);
        ellipse(this.x, this.y - 5, this.d / 6, this.d / 6);
    }

    kill() {
        let d = dist(pacman.x, pacman.y, this.x, this.y);
        if (d < w / 2) {
            if (this.alive) {
                if (this.killable) {
                    this.alive = false;
                    totalScore += 50;
                    setTimeout(() => {
                        this.x = floor(random(11, 15)) * w;
                        this.y = floor(random(9, 11)) * w;
                        this.alive = true;
                    }, 7000); //calling anonimous function by the old syntax ~function() {}~ doesn't work
                } else {
                    deathPac();
                }
            }
        }
    }

    move() {
        if (this.x % w == 0 && this.y % w == 0) {
            checkNeighbors(this.x, this.y, this.neighbors);
            //it's probably a dumb way of making the ghosts move, but I divided the move function into all the possible neighbors cells of the ghost
            //if all neighbors are walls (technically this is not needed)
            if (
                this.neighbors[0] &&
                this.neighbors[1] &&
                this.neighbors[2] &&
                this.neighbors[3]
            ) {
                this.speedX = 0;
                this.speedY = 0;
                //if 3 neighbors are walls (technically this is not needed)
            } else if (this.neighbors[0] && this.neighbors[1] && this.neighbors[2]) {
                this.speedX = -w / 10;
                this.speedY = 0;
            } else if (this.neighbors[0] && this.neighbors[1] && this.neighbors[3]) {
                this.speedX = 0;
                this.speedY = w / 10;
            } else if (this.neighbors[0] && this.neighbors[2] && this.neighbors[3]) {
                this.speedX = w / 10;
                this.speedY = 0;
            } else if (this.neighbors[3] && this.neighbors[1] && this.neighbors[2]) {
                this.speedX = 0;
                this.speedY = -w / 10;
                //if 2 neighbors are walls
            } else if (this.neighbors[0] && this.neighbors[1]) {
                this.r = random(1);
                if (this.r < 0.5) {
                    this.speedX = -w / 10;
                    this.speedY = 0;
                } else {
                    this.speedX = 0;
                    this.speedY = w / 10;
                }
            } else if (this.neighbors[0] && this.neighbors[2]) {
                this.r = random(1);
                //if the ghost is between 2 parallel walls, theres a little chance of 5% that it will change its direction
                if (this.r < 0.05) {
                    this.speedX = w / 10;
                    this.speedY = 0;
                } else if (this.r < 0.1) {
                    this.speedX = -w / 10;
                    this.speedY = 0;
                }
            } else if (this.neighbors[0] && this.neighbors[3]) {
                this.r = random(1);
                if (this.r < 0.5) {
                    this.speedX = w / 10;
                    this.speedY = 0;
                } else {
                    this.speedX = 0;
                    this.speedY = w / 10;
                }
            } else if (this.neighbors[1] && this.neighbors[2]) {
                this.r = random(1);
                if (this.r < 0.5) {
                    this.speedX = 0;
                    this.speedY = -w / 10;
                } else {
                    this.speedX = -w / 10;
                    this.speedY = 0;
                }
            } else if (this.neighbors[1] && this.neighbors[3]) {
                this.r = random(1);
                //if the ghost is between 2 parallel walls, theres a little chance of 5% that it will change its direction
                if (this.r < 0.05) {
                    this.speedX = 0;
                    this.speedY = w / 10;
                } else if (this.r < 0.1) {
                    this.speedX = 0;
                    this.speedY = -w / 10;
                }
            } else if (this.neighbors[2] && this.neighbors[3]) {
                this.r = random(1);
                if (this.r < 0.5) {
                    this.speedX = w / 10;
                    this.speedY = 0;
                } else {
                    this.speedX = 0;
                    this.speedY = -w / 10;
                }
                //if 1 neighbor is a wall
            } else if (this.neighbors[0]) {
                this.r = random(1);
                if (this.r < 0.333) {
                    this.speedX = w / 10;
                    this.speedY = 0;
                } else if (this.r < 0.667) {
                    this.speedX = -w / 10;
                    this.speedY = 0;
                } else {
                    this.speedX = 0;
                    this.speedY = w / 10;
                }
            } else if (this.neighbors[1]) {
                this.r = random(1);
                if (this.r < 0.333) {
                    this.speedX = 0;
                    this.speedY = w / 10;
                } else if (this.r < 0.667) {
                    this.speedX = 0;
                    this.speedY = -w / 10;
                } else {
                    this.speedX = -w / 10;
                    this.speedY = 0;
                }
            } else if (this.neighbors[2]) {
                this.r = random(1);
                if (this.r < 0.333) {
                    this.speedX = w / 10;
                    this.speedY = 0;
                } else if (this.r < 0.667) {
                    this.speedX = -w / 10;
                    this.speedY = 0;
                } else {
                    this.speedX = 0;
                    this.speedY = -w / 10;
                }
            } else if (this.neighbors[3]) {
                this.r = random(1);
                if (this.r < 0.333) {
                    this.speedX = 0;
                    this.speedY = w / 10;
                } else if (this.r < 0.667) {
                    this.speedX = 0;
                    this.speedY = -w / 10;
                } else {
                    this.speedX = w / 10;
                    this.speedY = 0;
                }
                //if there are no neighbor walls
            } else {
                this.r = random(1);
                if (this.r < 0.25) {
                    this.speedX = w / 10;
                    this.speedY = 0;
                } else if (this.r < 0.5) {
                    this.speedX = -w / 10;
                    this.speedY = 0;
                } else if (this.r < 0.75) {
                    this.speedX = 0;
                    this.speedY = w / 10;
                } else {
                    this.speedX = 0;
                    this.speedY = -w / 10;
                }
            }
        }
        if (this.x < -w / 2) {
            this.x = width - camWidth + w / 2;
        }
        if (this.x > width - camWidth + w / 2) {
            this.x = -w / 2;
        }
        if (this.y < -w / 2) {
            this.y = height + w / 2;
        }
        if (this.y > height + w / 2) {
            this.y = -w / 2;
        }
        this.x += this.speedX;
        this.y += this.speedY;
    }
}

function control(label) {
    if (label == "Y") {
        dir = 0;
    }
    if (label == "A") {
        dir = 1;
    }
    if (label == "X") {
        dir = 2;
    }
    if (label == "B") {
        dir = 3;
    }
}

//what happens when a ghost touches pacman
function deathPac() {
    noLoop();
}

//let ghosts be invulnerable again
function ghostInv() {
    for (let i = 0; i < ghostNum; i++) {
        ghosts[i].killable = false;
    }
}

function checkNeighbors(x, y, array) {
    if (array instanceof Array) {
        let i = floor(y / w);
        let j = floor(x / w);
        let top = grid[i - 1][j];
        let right = grid[i][j + 1];
        let bottom = grid[i + 1][j];
        let left = grid[i][j - 1];
        if (!top) {
            top = false;
        }
        if (!right) {
            right = false;
        }
        if (!bottom) {
            bottom = false;
        }
        if (!left) {
            left = false;
        }
        array[0] = top.wall;
        array[1] = right.wall;
        array[2] = bottom.wall;
        array[3] = left.wall;
    }
}

function win() {
    let count = 0;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (grid[i][j].score || grid[i][j].token) {
                count++;
            }
        }
    }
    if (count == 0) {
        return true;
    } else {
        return false;
    }
}

function level1() {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            grid[i][j].score = true;
        }
    }
    for (let i = 0; i < cols; i++) {
        grid[0][i].wall = true;
        grid[rows - 1][i].wall = true;
    }
    for (let i = 0; i < rows; i++) {
        grid[i][0].wall = true;
        grid[i][cols - 1].wall = true;
    }
    grid[10][0].wall = false;
    grid[10][0].score = false;
    grid[1][13].wall = true;
    grid[2][13].wall = true;
    grid[4][13].wall = true;
    grid[5][13].wall = true;
    grid[6][13].wall = true;
    grid[4][12].wall = true;
    grid[4][11].wall = true;
    grid[4][10].wall = true;
    grid[12][13].wall = true;
    grid[13][13].wall = true;
    grid[14][13].wall = true;
    grid[16][13].wall = true;
    grid[17][13].wall = true;
    grid[18][13].wall = true;
    grid[2][2].wall = true;
    grid[2][3].wall = true;
    grid[2][4].wall = true;
    grid[3][2].wall = true;
    grid[3][3].wall = true;
    grid[3][4].wall = true;
    grid[4][2].wall = true;
    grid[4][3].wall = true;
    grid[4][4].wall = true;
    grid[6][2].wall = true;
    grid[6][3].wall = true;
    grid[6][4].wall = true;
    grid[2][6].wall = true;
    grid[2][7].wall = true;
    grid[2][8].wall = true;
    grid[3][6].wall = true;
    grid[3][7].wall = true;
    grid[3][8].wall = true;
    grid[4][6].wall = true;
    grid[4][7].wall = true;
    grid[4][8].wall = true;
    grid[2][9].wall = true;
    grid[2][10].wall = true;
    grid[2][11].wall = true;
    grid[8][1].wall = true;
    grid[8][2].wall = true;
    grid[8][3].wall = true;
    grid[8][4].wall = true;
    grid[8][5].wall = true;
    grid[8][6].wall = true;
    grid[9][1].wall = true;
    grid[9][2].wall = true;
    grid[9][3].wall = true;
    grid[9][4].wall = true;
    grid[9][5].wall = true;
    grid[9][6].wall = true;
    grid[11][1].wall = true;
    grid[11][2].wall = true;
    grid[11][3].wall = true;
    grid[11][4].wall = true;
    grid[11][5].wall = true;
    grid[11][6].wall = true;
    grid[12][1].wall = true;
    grid[12][2].wall = true;
    grid[12][3].wall = true;
    grid[12][4].wall = true;
    grid[12][5].wall = true;
    grid[12][6].wall = true;
    grid[6][6].wall = true;
    grid[6][7].wall = true;
    grid[6][8].wall = true;
    grid[6][9].wall = true;
    grid[6][10].wall = true;
    grid[6][11].wall = true;
    grid[7][8].wall = true;
    grid[8][8].wall = true;
    grid[9][8].wall = true;
    grid[11][8].wall = true;
    grid[12][8].wall = true;
    grid[8][10].wall = true;
    grid[8][11].wall = true;
    grid[8][12].wall = true;
    grid[9][10].wall = true;
    grid[10][10].wall = true;
    grid[11][10].wall = true;
    grid[12][10].wall = true;
    grid[12][11].wall = true;
    grid[12][12].wall = true;
    grid[14][2].wall = true;
    grid[14][3].wall = true;
    grid[14][4].wall = true;
    grid[15][4].wall = true;
    grid[16][4].wall = true;
    grid[16][5].wall = true;
    grid[16][6].wall = true;
    grid[14][6].wall = true;
    grid[14][7].wall = true;
    grid[14][8].wall = true;
    grid[14][9].wall = true;
    grid[14][10].wall = true;
    grid[14][11].wall = true;
    grid[16][12].wall = true;
    grid[16][11].wall = true;
    grid[16][10].wall = true;
    grid[16][1].wall = true;
    grid[16][2].wall = true;
    grid[18][2].wall = true;
    grid[18][3].wall = true;
    grid[18][4].wall = true;
    grid[18][5].wall = true;
    grid[18][6].wall = true;
    grid[18][7].wall = true;
    grid[18][8].wall = true;
    grid[18][9].wall = true;
    grid[18][10].wall = true;
    grid[18][11].wall = true;
    grid[17][8].wall = true;
    grid[16][8].wall = true;
    grid[10][26].wall = true;
    for (let i = 0; i < cols / 2 + 1; i++) {
        for (let j = 0; j < rows; j++) {
            let temp = grid[j][i].wall;
            grid[j][26 - i].wall = temp;
        }
    }
    for (let i = 0; i < rows; i++) {
        grid[i][cols - 1].wall = true;
    }
    grid[10][26].wall = false;
    grid[10][26].score = false;
    for (let i = 9; i < 18; i++) {
        for (let j = 6; j < 13; j++) {
            grid[j][i].score = false;
        }
    }
    grid[3][1].power = true;
    grid[3][25].power = true;
    grid[15][1].power = true;
    grid[15][25].power = true;
    grid[15][13].score = false;
}
