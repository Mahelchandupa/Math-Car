// --- DOM Element Selectors ---
const game_start_container = document.getElementById("game_start_container");
const select_car_view = document.getElementById("select_car_view");
const active_game_container = document.getElementById("active_game_container");
const game_over_view = document.getElementById("game_over_view");

const math_questions_view = document.getElementById("math_questions_view");
const question_text = document.getElementById("question_text");
const game_timer = document.getElementById("game_timer");

const distance_hud = document.getElementById("distance_hud");
const speed_hud = document.getElementById("speed_hud");
const player_car = document.getElementById("player_car");
const final_distance = document.getElementById("final_distance");

const road_line_container = document.querySelector(".road_line_container");

// --- Game State Variables ---
let speed = 40;            // Starting speed in km/h
let distance = 0;          // Starting distance in meters
let question_time_left = 10; // Timer starting at 10 seconds for each question
let correct_answer = 0;    // Store the answer of the current question
let game_active = false;   // Flag to check if game is running
let game_paused = false;   // Flag to check if game is paused
let finish_distance = 1000;

let game_loop_interval = null;
let timer_interval = null;
let lane = 1;              // Car position lane (0 = Left, 1 = Middle, 2 = Right)

// --- Initial Setup: Create Road Lines ---
const line_1 = document.querySelector(".line-1");
const line_2 = document.querySelector(".line-2");

// We clone the initial pair of lines 4 times to fill the road vertically
for (let i = 1; i < 5; i++) {
  const c1 = line_1.cloneNode(true);
  const c2 = line_2.cloneNode(true);
  c1.style.top = (i * 20) + "%";
  c2.style.top = (i * 20) + "%";
  road_line_container.appendChild(c1);
  road_line_container.appendChild(c2);
}

// --- Game View Transitions ---

// Step 1: Start Game button clicked - show Car Selection screen
function start_game() {
  game_start_container.style.display = "none";
  select_car_view.style.display = "flex";
}

// Step 2: Car chosen - set car image source, show game screen, and init
function select_car(carSrc) {
  player_car.src = carSrc;
  select_car_view.style.display = "none";
  active_game_container.style.display = "flex";
  
  init_game();
}

// --- Core Game Functions ---

// Starts timers, resets stats, and loads the first math question
function init_game() {
  game_active = true;
  game_paused = false;
  speed = 5;
  distance = 0;
  question_time_left = 10;
  lane = 1;
  player_car.style.left = "50%"; // Center the car initially
  game_timer.innerText = question_time_left + "s";
  
  // Hide and reset finish line
  const finish_line = document.getElementById("finish_line");
  if (finish_line) {
    finish_line.style.display = "none";
    finish_line.style.top = "-50px";
  }
  
  // Make sure pause UI elements are reset
  document.getElementById("pause_btn").innerText = "⏸️ Pause";
  document.getElementById("paused_overlay").style.display = "none";

  generate_question();
  
  // Defensive: Clear any existing intervals first to prevent duplicate active loops
  clearInterval(game_loop_interval);
  clearInterval(timer_interval);
  
  // Game Loop runs every 30 milliseconds (approx. 33 frames per second)
  game_loop_interval = setInterval(game_loop, 30);
  
  // Countdown Timer runs every 1 second
  timer_interval = setInterval(update_timer, 1000);
}

// Animates the road lines and increases distance based on current speed
function game_loop() {
  if (!game_active || game_paused) return;
  
  // 1. Move the road lines downwards to create a driving effect
  const lines = document.querySelectorAll(".road_line");
  lines.forEach(line => {
    let topVal = parseFloat(line.style.top) || 0;
    
    // The road moves faster when speed is higher
    topVal += (speed / 20); 
    
    // If a line goes off the bottom of the container, wrap it back to the top
    if (topVal >= 100) {
      topVal = -10;
    }
    line.style.top = topVal + "%";
  });
  
  // 2. Update car vertical screen position based on current speed
  // At min speed (10), bottom is 20px. At max speed (120), bottom is 350px.
  let targetBottom = 20 + (speed - 10) * 3;
  player_car.style.bottom = targetBottom + "px";
  
  // 3. Increase distance driven
  distance += speed * 0.015;
  
  // 4. Update the HUD displays
  distance_hud.innerText = Math.floor(distance);
  speed_hud.innerText = Math.floor(speed);

  // 5. Update Finish Line position and check for game completion
  const finish_line = document.getElementById("finish_line");
  if (finish_line) {
    const final_stretch = 100; // meters before finish line to start showing it
    if (distance >= finish_distance - final_stretch) {
      finish_line.style.display = "block";
      const gameView = document.getElementById("game_view");
      const gameViewHeight = gameView ? gameView.clientHeight : 400;
      // Calculate target finish line top such that its bottom aligns with the car top when distance == finish_distance
      // car height is 100, finish line height is 40
      const endTop = gameViewHeight - targetBottom - 140; 
      const startTop = -50;
      const ratio = Math.min((distance - (finish_distance - final_stretch)) / final_stretch, 1);
      const currentTop = startTop + (endTop - startTop) * ratio;
      finish_line.style.top = currentTop + "px";
    } else {
      finish_line.style.display = "none";
    }
  }

  // 6. Check if player has crossed the finish line
  if (distance >= finish_distance) {
    end_game();
  }
}

// Counts down game time and ends the game when time runs out
function update_timer() {
  if (game_paused) return;

  question_time_left--;
  game_timer.innerText = question_time_left + "s";
  
  if (question_time_left <= 0) {
    // Reset timer for the next question and generate it
    question_time_left = 10;
    game_timer.innerText = question_time_left + "s";
    generate_question();
  }
}

// Generates a simple math question (numbers 1-6) and answer choices
function generate_question() {
  // Generate random numbers between 1 and 6
  const num1 = Math.floor(Math.random() * 6) + 1;
  const num2 = Math.floor(Math.random() * 6) + 1;
  
  const operators = ["+", "-", "*"];
  const op = operators[Math.floor(Math.random() * operators.length)];
  
  let questionText = "";
  
  if (op === "+") {
    questionText = `${num1} + ${num2}`;
    correct_answer = num1 + num2;
  } else if (op === "-") {
    // Avoid negative answers by making sure the larger number is first
    const max = Math.max(num1, num2);
    const min = Math.min(num1, num2);
    questionText = `${max} - ${min}`;
    correct_answer = max - min;
  } else if (op === "*") {
    questionText = `${num1} × ${num2}`;
    correct_answer = num1 * num2;
  }
  
  question_text.innerText = questionText;
  
  // Generate 3 unique choices (including the correct answer)
  let choices = [correct_answer];
  while (choices.length < 3) {
    // Pick a wrong answer offset by a random amount (-3 to +3)
    let offset = Math.floor(Math.random() * 7) - 3;
    let wrongAns = correct_answer + offset;
    
    // Make sure wrong answer is non-negative and not already in the choices
    if (wrongAns >= 0 && !choices.includes(wrongAns)) {
      choices.push(wrongAns);
    }
  }
  
  // Shuffle the choices randomly
  choices.sort(() => Math.random() - 0.5);
  
  // Display choices in the buttons
  const buttons = document.querySelectorAll(".answers_question_container .answer");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].innerText = choices[i];
  }
}

// Checks if player clicked the correct answer button
function check_answer(userAnswerText) {
  if (!game_active || game_paused) return;
  
  const answer = parseInt(userAnswerText);
  
  // Remove any previous flash classes
  math_questions_view.classList.remove("correct-flash-active", "wrong-flash-active");
  // Trigger a DOM reflow so the animation restarts
  void math_questions_view.offsetWidth;
  
  if (answer === correct_answer) {
    // Correct! Accelerate the car (max speed 120)
    speed = Math.min(speed + 15, 120);
    math_questions_view.classList.add("correct-flash-active");
  } else {
    // Wrong! Decelerate the car (min speed 10)
    speed = Math.max(speed - 15, 10);
    math_questions_view.classList.add("wrong-flash-active");
  }
  
  // Reset the question timer since we got a new question
  question_time_left = 10;
  game_timer.innerText = question_time_left + "s";

  // Instantly load the next math question
  generate_question();
}

// Toggles the paused/resumed state of the game
function toggle_pause() {
  if (!game_active) return;
  
  const paused_overlay = document.getElementById("paused_overlay");
  const pause_btn = document.getElementById("pause_btn");
  
  if (game_paused) {
    // Resume game loops and hide pause UI
    game_paused = false;
    paused_overlay.style.display = "none";
    pause_btn.innerText = "⏸️ Pause";
    
    game_loop_interval = setInterval(game_loop, 30);
    timer_interval = setInterval(update_timer, 1000);
  } else {
    // Pause game loops and show pause UI
    game_paused = true;
    paused_overlay.style.display = "flex";
    pause_btn.innerText = "▶️ Resume";
    
    clearInterval(game_loop_interval);
    clearInterval(timer_interval);
  }
}

// Stops game loops and displays the results screen
function end_game() {
  game_active = false;
  game_paused = false;
  clearInterval(game_loop_interval);
  clearInterval(timer_interval);
  
  active_game_container.style.display = "none";
  game_over_view.style.display = "flex";
  
  final_distance.innerText = Math.floor(distance);
}

// Returns the player to the car selection screen to race again
function restart_game() {
  game_over_view.style.display = "none";
  select_car_view.style.display = "flex";
  
  // Ensure pause elements are visually reset
  document.getElementById("pause_btn").innerText = "⏸️ Pause";
  document.getElementById("paused_overlay").style.display = "none";
}

// --- Input Controls ---
// Keydown Listener handles Steering (Left/Right) and manual driving controls (Up/Down)
// document.addEventListener("keydown", (e) => {
//   if (!game_active || game_paused) return;
  
//   // Prevent browser scrolling behavior with Arrow Keys
//   if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
//     e.preventDefault();
//   }
  
//   if (e.key === "ArrowLeft") {
//     lane = Math.max(lane - 1, 0); // Steer left lane
//   } else if (e.key === "ArrowRight") {
//     lane = Math.min(lane + 1, 2); // Steer right lane
//   } else if (e.key === "ArrowUp") {
//     speed = Math.min(speed + 1, 120); // Manual accelerate forward
//   } else if (e.key === "ArrowDown") {
//     speed = Math.max(speed - 5, 10); // Manual decelerate/brake
//   }
  
//   // Move player car to corresponding lane horizontal percentage
//   if (lane === 0) {
//     player_car.style.left = "20%";
//   } else if (lane === 1) {
//     player_car.style.left = "50%";
//   } else if (lane === 2) {
//     player_car.style.left = "80%";
//   }
// });