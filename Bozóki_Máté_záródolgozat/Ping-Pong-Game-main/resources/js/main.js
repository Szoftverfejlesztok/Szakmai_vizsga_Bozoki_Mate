// Elemek kiválasztása
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const panel = document.querySelector(".panel");
const play = document.querySelector(".play");
const mode = document.querySelector("input[type=text]");
const modeValues = document.querySelectorAll(".mode");
const statPanel = document.querySelector(".stat");

const comScore = new Audio();
comScore.src = "resources/audio/comScore.mp3";
const userScore = new Audio();
userScore.src = "resources/audio/userScore.mp3";

// A felhasználó kiválasztja a játék módot.
modeValues.forEach((modeValue) => {
    modeValue.addEventListener("click", () => {
        modeValues.forEach((index) => {
            index.classList.remove("selected");
        });
        modeValue.classList.add("selected");
        let value = modeValue.dataset.number;
        mode.value = value;
    });
});
let compSpeed; // A számítógép sebessége, amely kiválasztja a mód adatkészletét.

canvas.width = 600;
canvas.height = 400;

let user = {
    width: 10,
    height: 100,
    color: "white",
    x: 10,
    y: (canvas.height - 100) / 2,
    score: 0,
};

let computer = {
    width: 10,
    height: 100,
    color: "white",
    x: canvas.width - 20,
    y: (canvas.height - 100) / 2,
    score: 0,
};

let ball = {
    radius: 10,
    velocity: {
        x: 7,
        y: 7,
    },
    speed: 7,
    color: "white",
    x: canvas.width / 2,
    y: canvas.height / 2,
};

let net = {
    x: (canvas.width - 2) / 2,
    y: 0,
    color: "white",
    width: 2,
    height: 10,
};

// Funkció téglalap, kör, szöveg, háló rajzolásához.
function drawRect(x, y, w, h, c) {
    ctx.beginPath();
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
    ctx.closePath();
}

function drawArc(x, y, r, c) {
    ctx.beginPath();
    ctx.fillStyle = c;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}

function drawText(text, x, y) {
    ctx.font = "75px arial";
    ctx.fillStyle = "white";
    ctx.fillText(text, x, y);
}

function drawNet() {
    for (let i = 0; i < canvas.width; i += 15) {
        drawRect(net.x, net.y + i, net.width, net.height, net.color);
    }
}


class Particle {
    constructor(x, y, color, radius, velocity) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = radius;
        this.velocity = velocity;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.abs(this.radius), 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.radius -= 0.01;
        this.draw();
    }
}

// Felhasználói csúszka használata.
canvas.addEventListener("mousemove", (e) => {
    let rect = canvas.getBoundingClientRect().top;
    user.y = e.clientY - rect - user.height / 2;
});

canvas.addEventListener("touchmove", (e) => {
    let rect = canvas.getBoundingClientRect().top;
    user.y = e.changedTouches[0].clientY - rect - user.height / 2;
});

canvas.addEventListener("touchstart", (e) => {
    let rect = canvas.getBoundingClientRect().top;
    user.y = e.changedTouches[0].clientY - rect - user.height / 2;
});

// Ütközésészlelés.
function collision(b, p) {
    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;

    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    return (
        p.left < b.right &&
        p.top < b.bottom &&
        p.right > b.left &&
        p.bottom > b.top
    );
}

// A labda visszaállítása
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = 0;
    ball.velocity.y = 0;
    ball.velocity.x = 0;

    timeout = setTimeout(() => {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.speed = 7;
        ball.velocity.y = Math.random() < 0.5 ? 7 : -7;
        ball.velocity.x = Math.random() < 0.5 ? 7 : -7;
        console.log("g");
    }, 1500);
}

// GameOver funkció
function gameOver() {
    let stat;
    let maxScore = 10;

    // These codes match with both players.
    function commonCodes() {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.speed = 0;
        cancelAnimationFrame(gameId);
        panel.classList.add("reveal");
    }
    if (user.score >= maxScore) {
        stat = "Nyertél!";
        commonCodes();
    } else if (computer.score >= maxScore) {
        stat = "Vesztettél!";
        commonCodes();
    }
    statPanel.textContent = stat; // A statisztika megjelenik a statisztikai panelen
}


function draw() {
    drawRect(0, 0, canvas.width, canvas.height, "#089c29");
    drawRect(user.x, user.y, user.width, user.height, user.color);
    drawRect(
        computer.x,
        computer.y,
        computer.width,
        computer.height,
        computer.color
    );
    drawArc(ball.x, ball.y, ball.radius, ball.color);
    drawNet();
    drawText(user.score, canvas.width / 4, canvas.height / 5);
    drawText(computer.score, (3 * canvas.width) / 4, canvas.height / 5);
}

let gameId; // Az azonosító, amely befejezi és elindítja a játékot.
let timeout; // A labda intervallumának változója.
let particles = [];
function game() {
    gameId = requestAnimationFrame(game);
    draw();
    gameOver();

    // Ütközésérzékelés felső és alsó falhoz.
    if (
        ball.y + ball.radius + ball.velocity.y > canvas.height ||
        ball.y - ball.radius < 0
    ) {
        ball.velocity.y = -ball.velocity.y;
    }

    // Ütközésérzékelés bal és jobb falhoz.
    if (ball.x + ball.radius + ball.velocity.x > canvas.width) {
        // Ha a labda a jobb falat érinti, a felhasználó pontot kap.
        resetBall();
        userScore.play();
        console.log(userScore);
        user.score += 1;
    } else if (ball.x - ball.radius < 0) {
        // Ellenkező esetben, ha a labda a bal falat érinti, a számítógép pontot kap.
        resetBall();
        comScore.play();
        console.log(comScore);
        computer.score += 1;
    }

    // A labda helyzetének növelése.
    ball.x += ball.velocity.x;
    ball.y += ball.velocity.y;

    
    computer.y += (ball.y - (computer.y + computer.height / 2)) * compSpeed;

    // Melyik játékos fog most ütni.
    let player = ball.x + ball.radius < canvas.width / 2 ? user : computer;

    // Ha ütközés történik,
    if (collision(ball, player)) {
        
        let collidePoint = ball.y - (player.y + player.height / 2);
        collidePoint = collidePoint / (player.height / 2);
        let angle = (Math.PI / 4) * collidePoint;
        let direction = ball.x + ball.radius < canvas.width / 2 ? 1 : -1;
        ball.velocity.x = direction * Math.cos(angle) * ball.speed;
        ball.velocity.y = Math.sin(angle) * ball.speed;

     
        ball.speed += 0.5;

        // Részecske-robbanás
        if (player == user) {
            
            for (let i = 0; i < ball.radius; i++) {
                let x = player.x + player.width;
                let y = ball.y + ball.radius;
                particles.push(
                    new Particle(
                        x,
                        y,
                        `hsl(${Math.round(Math.random() * 360)}, 50%, 50%)`,
                        Math.random() * 3 + 0.5,
                        {
                            x: Math.random() * 3,
                            y: (Math.random() - 0.5) * 3,
                        }
                    )
                );
            }
        } else if (player == computer) {
         
            for (let i = 0; i < ball.radius; i++) {
                let x = player.x - player.width;
                let y = ball.y + ball.radius;
                particles.push(
                    new Particle(
                        x,
                        y,
                        `hsl(${Math.round(Math.random() * 360)}, 50%, 50%)`,
                        Math.random() * 3 + 0.5,
                        {
                            x: -Math.random() * 3,
                            y: (Math.random() - 0.5) * 3,
                        }
                    )
                );
            }
        }
    }

    particles.forEach((particle) => {
       
        if (particle.radius <= 0) {
            particles.splice(particle, 1);
        } else {
            particle.update();
        }
    });
}

play.addEventListener("click", () => {
    cancelAnimationFrame(gameId); 
    user.score = 0; 
    computer.score = 0; 
    panel.classList.remove("reveal"); 
    resetBall(); 
    clearTimeout(timeout); 
    ball.speed = 7; 
    ball.velocity = {
        x: 7,
        y: 7,
    };
    if (mode.value == "") {
        alert("Please Select A Mode First!");
        panel.classList.add("reveal");
        return;
    }
    
    compSpeed = mode.value;
  
    game();
});


window.addEventListener("resize", () => {
    Resize();
});

function Resize() {
    
    if (window.innerWidth <= 620) {
        alert("Please Rotate Your Device.");
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
    } else {
        canvas.width = 600;
        canvas.height = 400;
    }
}

Resize();
