// --- DOM Element Selectors ---
const game_start_container = document.getElementById("game_start_container");
const select_car_view = document.getElementById("select_car_view");
const active_game_container = document.getElementById("active_game_container");
const game_over_view = document.getElementById("game_over_view");
const screen_difficulty = document.getElementById("screen_difficulty");

const math_questions_view = document.getElementById("math_questions_view");
const question_text = document.getElementById("question_text");
const game_timer = document.getElementById("game_timer");

const distance_hud = document.getElementById("distance_hud");
const speed_hud = document.getElementById("speed_hud");
const player_car = document.getElementById("player_car");
const final_distance = document.getElementById("final_distance");
const defeating_car = document.getElementById("defeating_car")

const road_line_container = document.querySelector(".road_line_container");
const obstacle_container = document.getElementById("obstacle_container");
const obstacle = document.getElementById("obstacle");

const your_coin_txt = document.getElementById("your_coin_txt");

const obstacle_items = [
  "assets/obstacle_1.png",
  "assets/obstacle_2.png",
  "assets/obstacle_1.png",
];

// --- LocalStorage State Management & Economy Configuration ---
const STORAGE_KEY = "math_race_game_data_v1";

const CAR_CATALOG = [
  { id: "car_1", name: "Red Thunder", src: "assets/player_car_1.png", price: 0 },
  { id: "car_2", name: "Blue Streak", src: "assets/player_car_2.png", price: 300 },
  { id: "car_3", name: "Cyber Speed", src: "assets/player_car_3.png", price: 750 },
  { id: "car_4", name: "Golden Phantom", src: "assets/player_car_4.png", price: 1500 }
];

// Difficulty Coin Rewards & Multipliers
const DIFFICULTY_CONFIG = {
  beginner: { correctCoins: 10, winBonus: 50, streakBonus: 10 },
  intermediate: { correctCoins: 20, winBonus: 120, streakBonus: 15 },
  advanced: { correctCoins: 35, winBonus: 250, streakBonus: 25 }
};

let userGameData = {
  coins: 0,
  selectedCarId: "car_1",
  unlockedCars: ["car_1"],
  stats: {
    racesPlayed: 0,
    victories: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalDistance: 0
  }
};

function load_user_data() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      userGameData = {
        coins: typeof parsed.coins === "number" ? parsed.coins : 0,
        selectedCarId: parsed.selectedCarId || "car_1",
        unlockedCars: Array.isArray(parsed.unlockedCars) ? parsed.unlockedCars : ["car_1"],
        stats: {
          racesPlayed: parsed.stats?.racesPlayed || 0,
          victories: parsed.stats?.victories || 0,
          totalCorrect: parsed.stats?.totalCorrect || 0,
          totalWrong: parsed.stats?.totalWrong || 0,
          totalDistance: parsed.stats?.totalDistance || 0
        }
      };
    }
  } catch (err) {
    console.warn("Could not parse saved game data, using defaults", err);
  }
  update_coin_display();
}

function save_user_data() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userGameData));
    update_coin_display();
  } catch (err) {
    console.error("Failed to save to localStorage", err);
  }
}

function update_coin_display() {
  const coinsElem = document.getElementById("coins");
  if (coinsElem) coinsElem.innerText = userGameData.coins;
}

// --- In-Race Tracking Variables ---
let round_correct = 0;
let round_wrong = 0;
let round_streak = 0;
let round_coins_earned = 0;
let round_answer_coins = 0;

// --- Game State Variables ---
let speed = 30;            // Starting speed in km/h (updated to 30)
let distance = 0;          // Starting distance in meters
let defeat_speed = 50;     // Defeating car speed in km/h
let defeat_distance = 0;   // Defeating car distance in meters
let question_time_left = 10; // Timer starting at 10 seconds for each question
let correct_answer = 0;    // Store the answer of the current question
let game_active = false;   // Flag to check if game is running
let game_paused = false;   // Flag to check if game is paused
let finish_distance = 2000;
let max_speed = 100;       // Maximum speed in km/h based on difficulty
let defeat_max_speed = 90; // Defeat car maximum speed based on difficulty

let game_loop_interval = null;
let timer_interval = null;
let lane = 1;              // Car position lane (0 = Left, 1 = Middle, 2 = Right)
let obstacle_spawn_timer = 0;
let defeat_collision_cooldown = false;

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

// --- Car Shop & Dynamic Rendering ---
function render_car_shop() {
  const container = document.getElementById("car_shop_container");
  if (!container) return;
  container.innerHTML = "";

  CAR_CATALOG.forEach(car => {
    const isUnlocked = userGameData.unlockedCars.includes(car.id);
    const isSelected = userGameData.selectedCarId === car.id;
    const canAfford = userGameData.coins >= car.price;

    const card = document.createElement("div");
    card.className = `car_card ${isSelected ? "selected" : ""} ${!isUnlocked ? "locked" : ""}`;

    let buttonHtml = "";
    if (isSelected) {
      buttonHtml = `<button class="car_action_btn btn_selected" disabled>Selected ✓</button>`;
    } else if (isUnlocked) {
      buttonHtml = `<button class="car_action_btn btn_select" onclick="choose_car('${car.id}')">Select</button>`;
    } else {
      buttonHtml = `<button class="car_action_btn btn_buy" ${canAfford ? "" : "disabled"} onclick="buy_car('${car.id}')">
        ${canAfford ? `Buy 🪙 ${car.price}` : `Need 🪙 ${car.price}`}
      </button>`;
    }

    card.innerHTML = `
      <div class="car_img_wrapper">
        <img class="select_car" src="${car.src}" alt="${car.name}">
        ${!isUnlocked ? `<div class="lock_overlay_badge">🔒</div>` : ""}
      </div>
      <div class="car_title_name">${car.name}</div>
      <div class="car_price_tag">${car.price === 0 ? "FREE" : `🪙 ${car.price}`}</div>
      ${buttonHtml}
    `;

    // Allow clicking the card/image directly to select if unlocked
    if (isUnlocked && !isSelected) {
      card.addEventListener("click", (e) => {
        if (!e.target.classList.contains("car_action_btn")) {
          choose_car(car.id);
        }
      });
    }

    container.appendChild(card);
  });
}

function choose_car(carId) {
  userGameData.selectedCarId = carId;
  const carObj = CAR_CATALOG.find(c => c.id === carId);
  if (carObj) {
    player_car.src = carObj.src;
  }
  save_user_data();
  render_car_shop();
}

function buy_car(carId) {
  const car = CAR_CATALOG.find(c => c.id === carId);
  if (!car) return;

  if (userGameData.coins < car.price) {
    alert("Not enough coins! Win races and solve math questions to earn more.");
    return;
  }

  // Deduct coins and unlock
  userGameData.coins -= car.price;
  userGameData.unlockedCars.push(carId);
  userGameData.selectedCarId = carId;
  player_car.src = car.src;

  save_user_data();
  render_car_shop();
}

function confirm_car_selection() {
  const activeCar = CAR_CATALOG.find(c => c.id === userGameData.selectedCarId) || CAR_CATALOG[0];
  player_car.src = activeCar.src;
  select_car_view.style.display = "none";
  screen_difficulty.style.display = "flex";
}

// --- Instructions & Statistics Navigation ---
function open_instructions() {
  game_start_container.style.display = "none";
  document.getElementById("instructions_view").style.display = "flex";
}

function close_instructions() {
  document.getElementById("instructions_view").style.display = "none";
  game_start_container.style.display = "flex";
}

function open_stats() {
  const stats = userGameData.stats;
  document.getElementById("stat_total_coins").innerText = `${userGameData.coins} 🪙`;
  document.getElementById("stat_races_played").innerText = stats.racesPlayed;
  document.getElementById("stat_victories").innerText = stats.victories;

  const winRate = stats.racesPlayed > 0 ? Math.round((stats.victories / stats.racesPlayed) * 100) : 0;
  document.getElementById("stat_win_rate").innerText = `${winRate}%`;

  document.getElementById("stat_correct").innerText = stats.totalCorrect;
  const totalAnswers = stats.totalCorrect + stats.totalWrong;
  const acc = totalAnswers > 0 ? Math.round((stats.totalCorrect / totalAnswers) * 100) : 0;
  document.getElementById("stat_accuracy").innerText = `${acc}%`;

  document.getElementById("stat_total_dist").innerText = `${Math.floor(stats.totalDistance)} m`;
  document.getElementById("stat_cars_owned").innerText = `${userGameData.unlockedCars.length} / ${CAR_CATALOG.length}`;

  game_start_container.style.display = "none";
  document.getElementById("stats_view").style.display = "flex";
}

function close_stats() {
  document.getElementById("stats_view").style.display = "none";
  game_start_container.style.display = "flex";
}

function reset_all_stats() {
  if (confirm("Are you sure you want to reset all your progress, coins, and unlocked cars?")) {
    userGameData = {
      coins: 0,
      selectedCarId: "car_1",
      unlockedCars: ["car_1"],
      stats: {
        racesPlayed: 0,
        victories: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalDistance: 0
      }
    };
    save_user_data();
    open_stats();
    render_car_shop();
  }
}

// --- Game View Transitions ---

let selected_difficulty = "beginner";

// Step 1: Start Game button clicked - show Car Selection screen
function start_game() {
  game_start_container.style.display = "none";
  select_car_view.style.display = "flex";
  render_car_shop();
}

// Step 2: Car chosen - set car image source, show difficulty selection screen
function select_car(carSrc) {
  player_car.src = carSrc;
  select_car_view.style.display = "none";
  screen_difficulty.style.display = "flex";
}

function set_difficulty(cardElement, diff) {
  selected_difficulty = diff;
  const cards = document.querySelectorAll(".difficulty-card");
  cards.forEach(card => card.classList.remove("selected"));
  if (cardElement) {
    cardElement.classList.add("selected");
  }
}

function back_to_car_select() {
  screen_difficulty.style.display = "none";
  select_car_view.style.display = "flex";
  render_car_shop();
}

function start_race_with_difficulty() {
  select_difficulty(selected_difficulty);
}

function select_difficulty(difficulty) {
  selected_difficulty = difficulty || selected_difficulty;
  screen_difficulty.style.display = "none";
  active_game_container.style.display = "flex";
  console.log(selected_difficulty);

  if (selected_difficulty === "beginner") {
    finish_distance = 2000;
    max_speed = 150;
    question_time_left = 10;
    defeat_max_speed = 120;
  } else if (selected_difficulty === "intermediate") {
    finish_distance = 4000;
    max_speed = 300;
    question_time_left = 10;
    defeat_max_speed = 280;
  } else if (selected_difficulty === "advanced") {
    finish_distance = 6000;
    max_speed = 500;
    defeat_max_speed = 470;
    question_time_left = 15;
  }

  const max_speed_hud = document.getElementById("max_speed_hud");
  if (max_speed_hud) {
    max_speed_hud.innerText = max_speed;
  }

  init_game();
}

const handle_obstacle = () => {
  if (!obstacle_container) return;

  // 1. Periodically spawn a new obstacle (every ~2.5s / 80 frames at 30ms interval)
  obstacle_spawn_timer++;
  if (obstacle_spawn_timer >= 80) {
    obstacle_spawn_timer = 0;
    const obstacle = document.createElement("img");
    obstacle.src = obstacle_items[Math.floor(Math.random() * obstacle_items.length)];
    obstacle.classList.add("obstacle");
    obstacle.style.left = (Math.random() * 70 + 10) + "%";
    obstacle.style.top = "-10%";
    obstacle.style.width = "70px";
    obstacle.style.height = "70px";
    obstacle_container.appendChild(obstacle);
  }

  // 2. Move active obstacles down the road at the current driving speed
  const obstacles = obstacle_container.querySelectorAll(".obstacle");
  obstacles.forEach(obs => {
    let topVal = parseFloat(obs.style.top) || 0;
    topVal += (speed / 20);
    if (topVal >= 110) {
      obs.remove(); // Remove obstacle once it scrolls out of view
    } else {
      obs.style.top = topVal + "%";
    }
  });

  // 3. Check for collisions between player car and active obstacles
  handle_obstacle_collision();
}

// Handles collision between player car and opponent (defeating) car
function handle_defeat_car_collision() {
  if (!game_active || game_paused || !player_car || !defeating_car || defeat_collision_cooldown) return;

  const playerRect = player_car.getBoundingClientRect();
  const defeatCarRect = defeating_car.getBoundingClientRect();
  if (playerRect.width === 0 || defeatCarRect.width === 0) return;

  // Collision hitbox with an inset margin for fair detection
  const playerHitbox = {
    top: playerRect.top + 15,
    bottom: playerRect.bottom - 15,
    left: playerRect.left + 15,
    right: playerRect.right - 15,
  };

  const defeatCarHitbox = {
    top: defeatCarRect.top + 10,
    bottom: defeatCarRect.bottom - 10,
    left: defeatCarRect.left + 10,
    right: defeatCarRect.right - 10,
  };

  // AABB collision detection
  const isColliding = !(
    playerHitbox.right < defeatCarHitbox.left ||
    playerHitbox.left > defeatCarHitbox.right ||
    playerHitbox.bottom < defeatCarHitbox.top ||
    playerHitbox.top > defeatCarHitbox.bottom
  );

  if (isColliding) {
    // 1. Activate cooldown so speed isn't drained 33 times per second
    defeat_collision_cooldown = true;

    // 2. Slow down player (penalty of 20 km/h, minimum speed kept at 10 km/h)
    speed = Math.max(speed - 20, 10);
    speed_hud.innerText = Math.floor(speed);

    // 3. Visual hit feedback
    player_car.classList.remove("car-hit");
    void player_car.offsetWidth;
    player_car.classList.add("car-hit");

    // 4. Temporary invulnerability flashing effect
    player_car.style.opacity = "0.6";

    setTimeout(() => {
      player_car.classList.remove("car-hit");
    }, 450);

    // 5. Reset invulnerability cooldown after 1.2 seconds
    setTimeout(() => {
      player_car.style.opacity = "1";
      defeat_collision_cooldown = false;
    }, 1200);
  }
}

// Handles collision between player car and obstacles: slows down player and hides the obstacle
function handle_obstacle_collision() {
  if (!game_active || game_paused || !player_car || !obstacle_container) return;

  const playerRect = player_car.getBoundingClientRect();
  if (playerRect.width === 0 || playerRect.height === 0) return;

  // Collision hitbox with an inset margin for fair detection
  const playerHitbox = {
    top: playerRect.top + 15,
    bottom: playerRect.bottom - 15,
    left: playerRect.left + 15,
    right: playerRect.right - 15,
  };

  const obstacles = obstacle_container.querySelectorAll(".obstacle");
  obstacles.forEach(obs => {
    // Ignore already hit or hidden obstacles
    if (obs.dataset.hit === "true" || obs.style.display === "none") return;

    const obsRect = obs.getBoundingClientRect();
    if (obsRect.width === 0 || obsRect.height === 0) return;

    const obsHitbox = {
      top: obsRect.top + 10,
      bottom: obsRect.bottom - 10,
      left: obsRect.left + 10,
      right: obsRect.right - 10,
    };

    // Check AABB collision
    const isColliding = !(
      playerHitbox.right < obsHitbox.left ||
      playerHitbox.left > obsHitbox.right ||
      playerHitbox.bottom < obsHitbox.top ||
      playerHitbox.top > obsHitbox.bottom
    );

    if (isColliding) {
      // Mark as hit so it doesn't trigger multiple times in consecutive frames
      obs.dataset.hit = "true";

      // 1. Hide and remove the obstacle
      obs.style.display = "none";
      obs.remove();

      // 2. Slow down player car (penalty of 25 km/h, minimum speed capped at 10 km/h)
      speed = Math.max(speed - 5, 30);
      speed_hud.innerText = Math.floor(speed);

      // 3. Visual hit feedback (crash shake and red glow)
      player_car.classList.remove("car-hit");
      void player_car.offsetWidth; // Force reflow to retrigger animation
      player_car.classList.add("car-hit");
      setTimeout(() => {
        player_car.classList.remove("car-hit");
      }, 450);
    }
  });
}

// Aliases for compatibility
const handle_colition = handle_obstacle_collision;
const handle_collision = handle_obstacle_collision;

// --- Core Game Functions ---

// Starts timers, resets stats, and loads the first math question
function init_game() {
  game_active = true;
  game_paused = false;
  speed = 30;
  distance = 0;
  defeat_speed = 40;
  defeat_distance = 0;
  question_time_left = 10;
  lane = 1;
  player_car.style.left = "60%"; // Center the car initially
  game_timer.innerText = question_time_left + "s";
  defeating_car.style.left = "40%";
  
  // Clear any active obstacles and reset spawn counter & cooldown
  obstacle_spawn_timer = 0;
  defeat_collision_cooldown = false;
  player_car.style.opacity = "1";
  player_car.classList.remove("car-hit");
  if (obstacle_container) {
    obstacle_container.innerHTML = "";
  }
  
  // Hide and reset finish line
  const finish_line = document.getElementById("finish_line");
  if (finish_line) {
    finish_line.style.display = "none";
    finish_line.style.top = "-50px";
  }
  
  // Reset in-race statistics and coin trackers
  round_correct = 0;
  round_wrong = 0;
  round_streak = 0;
  round_coins_earned = 0;
  round_answer_coins = 0;
  
  const raceCoinsHud = document.getElementById("race_coins_hud");
  if (raceCoinsHud) {
    raceCoinsHud.innerText = "0";
  }

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
  
  // 2. Update car vertical screen position proportionally based on dynamic max_speed
  let speedRatio = Math.min(Math.max((speed - 10) / (max_speed - 10), 0), 1);
  let targetBottom = 20 + (speedRatio * 320);
  player_car.style.bottom = targetBottom + "px";
  
  // 3. Increase distance driven
  distance += speed * 0.015;
  defeat_distance += defeat_speed * 0.015;
  
  // 4. Update defeating car position relative to the player
  let distance_diff = defeat_distance - distance;
  let defeatTargetBottom = targetBottom + (distance_diff * 4); // 1 meter = 4 pixels
  defeating_car.style.bottom = defeatTargetBottom + "px";

  // Check collision between player and opponent car on all difficulty modes
  handle_defeat_car_collision();

  if (selected_difficulty === "advanced"){
     handle_obstacle();
  }
  
  // 5. Update the HUD displays
  distance_hud.innerText = Math.floor(distance);
  speed_hud.innerText = Math.floor(speed);

  // 6. Update Finish Line position and check for game completion
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

  // 7. Check if player or opponent has crossed the finish line
  if (defeat_distance >= finish_distance) {
    end_game(false); // Player loses
  } else if (distance >= finish_distance) {
    end_game(true); // Player wins
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

// Generates math questions based on the selected difficulty level
function generate_question() {
  let questionText = "";
  
  if (selected_difficulty === "beginner") {
    // Basic addition & subtraction (numbers 1-12)
    const op = Math.random() < 0.5 ? "+" : "-";
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    if (op === "+") {
      questionText = `${num1} + ${num2}`;
      correct_answer = num1 + num2;
    } else {
      const max = Math.max(num1, num2);
      const min = Math.min(num1, num2);
      questionText = `${max} - ${min}`;
      correct_answer = max - min;
    }
  } else if (selected_difficulty === "intermediate") {
    // Multiplication, division, and larger sums
    const mode = Math.floor(Math.random() * 3);
    if (mode === 0) {
      const a = Math.floor(Math.random() * 11) + 2;
      const b = Math.floor(Math.random() * 11) + 2;
      questionText = `${a} × ${b}`;
      correct_answer = a * b;
    } else if (mode === 1) {
      const divisor = Math.floor(Math.random() * 9) + 2;
      const quotient = Math.floor(Math.random() * 10) + 2;
      const dividend = divisor * quotient;
      questionText = `${dividend} ÷ ${divisor}`;
      correct_answer = quotient;
    } else {
      const a = Math.floor(Math.random() * 35) + 15;
      const b = Math.floor(Math.random() * 35) + 10;
      questionText = `${a} + ${b}`;
      correct_answer = a + b;
    }
  } else {
    // Advanced: Squares, double digit factors, equations
    const mode = Math.floor(Math.random() * 3);
    if (mode === 0) {
      const n = Math.floor(Math.random() * 12) + 4;
      questionText = `${n}²`;
      correct_answer = n * n;
    } else if (mode === 1) {
      const a = Math.floor(Math.random() * 12) + 11;
      const b = Math.floor(Math.random() * 8) + 4;
      questionText = `${a} × ${b}`;
      correct_answer = a * b;
    } else {
      const a = Math.floor(Math.random() * 80) + 50;
      const b = Math.floor(Math.random() * 40) + 15;
      questionText = `${a} - ${b}`;
      correct_answer = a - b;
    }
  }
  
  question_text.innerText = questionText;
  
  // Generate 3 unique choices (including the correct answer)
  let choices = [correct_answer];
  while (choices.length < 3) {
    let spread = Math.max(3, Math.floor(correct_answer * 0.2));
    let offset = Math.floor(Math.random() * (spread * 2 + 1)) - spread;
    if (offset === 0) offset = Math.random() < 0.5 ? 1 : -1;
    let wrongAns = correct_answer + offset;
    
    if (wrongAns >= 0 && !choices.includes(wrongAns)) {
      choices.push(wrongAns);
    }
  }
  
  // Shuffle the choices randomly
  choices.sort(() => Math.random() - 0.5);
  
  // Display choices in the buttons with keyboard shortcut badges
  const buttons = document.querySelectorAll(".answers_question_container .answer");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].setAttribute("data-answer", choices[i]);
    buttons[i].innerHTML = `${choices[i]} <span class="key-hint">${i + 1}</span>`;
  }
}

// Checks if player clicked the correct answer button
function check_answer(userAnswer) {
  if (!game_active || game_paused) return;
  
  let answer;
  if (typeof userAnswer === "object" && userAnswer !== null) {
    answer = parseInt(userAnswer.getAttribute("data-answer") || userAnswer.innerText);
  } else if (typeof userAnswer === "number") {
    answer = userAnswer;
  } else {
    answer = parseInt(userAnswer);
  }
  
  // Remove any previous flash classes
  math_questions_view.classList.remove("correct-flash-active", "wrong-flash-active");
  // Trigger a DOM reflow so the animation restarts
  void math_questions_view.offsetWidth;
  
  if (answer === correct_answer) {
    // Correct! Accelerate the cars up to the chosen difficulty's max speed
    speed = Math.min(speed + 15, max_speed);
    defeat_speed = Math.min(defeat_speed + 15, defeat_max_speed);
    math_questions_view.classList.add("correct-flash-active");

    // Track round and lifetime statistics
    round_correct++;
    round_streak++;
    
    // Calculate coins for this question based on difficulty
    const diffCfg = DIFFICULTY_CONFIG[selected_difficulty] || DIFFICULTY_CONFIG.beginner;
    let gainedCoins = diffCfg.correctCoins;

    // Streak bonus: every 3 correct answers in a row
    if (round_streak % 3 === 0) {
      gainedCoins += diffCfg.streakBonus;
    }

    round_answer_coins += gainedCoins;
    round_coins_earned += gainedCoins;

    // Update Live Race HUD
    const raceCoinsHud = document.getElementById("race_coins_hud");
    if (raceCoinsHud) {
      raceCoinsHud.innerText = round_coins_earned;
    }

    // Floating Coin Animation
    show_coin_feedback(`+${gainedCoins} 🪙`);
  } else {
    // Wrong! Decelerate the cars
    speed = Math.max(speed - 10, 10);
    defeat_speed = Math.max(defeat_speed - 3, 30);
    math_questions_view.classList.add("wrong-flash-active");

    round_wrong++;
    round_streak = 0; // Reset streak on mistake
  }
  
  // Reset the question timer since we got a new question
  question_time_left = 10;
  game_timer.innerText = question_time_left + "s";

  // Instantly load the next math question
  generate_question();
}

const lane_positions = ["25%", "60%", "85%"];

function change_lane(direction) {
  lane = Math.max(0, Math.min(lane + direction, lane_positions.length - 1));
  player_car.style.left = lane_positions[lane];
}

// Keyboard controls: Press 1, 2, or 3 to select answers; Arrow keys or A/D to steer
window.addEventListener("keydown", (e) => {
  if (!game_active || game_paused) return;

  // Steer between road lanes
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    change_lane(-1);
  } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    change_lane(1);
  }

  // Answer math questions with keys 1, 2, 3
  let btnIndex = -1;
  if (e.key === "1" || e.code === "Digit1" || e.code === "Numpad1") btnIndex = 0;
  else if (e.key === "2" || e.code === "Digit2" || e.code === "Numpad2") btnIndex = 1;
  else if (e.key === "3" || e.code === "Digit3" || e.code === "Numpad3") btnIndex = 2;

  if (btnIndex !== -1) {
    const buttons = document.querySelectorAll(".answers_question_container .answer");
    if (buttons[btnIndex]) {
      e.preventDefault();
      buttons[btnIndex].classList.add("btn-pressed");
      setTimeout(() => buttons[btnIndex].classList.remove("btn-pressed"), 150);
      buttons[btnIndex].click();
    }
  }
});

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

// Displays a floating coin animation above math questions view
function show_coin_feedback(text) {
  const popup = document.createElement("div");
  popup.className = "coin-floating-feedback";
  popup.innerText = text;
  math_questions_view.appendChild(popup);
  setTimeout(() => popup.remove(), 1000);
}

// Stops game loops and displays the results screen
function end_game(playerWon) {
  game_active = false;
  game_paused = false;
  clearInterval(game_loop_interval);
  clearInterval(timer_interval);
  
  active_game_container.style.display = "none";
  game_over_view.style.display = "flex";
  
  final_distance.innerText = Math.floor(distance);

  const diffCfg = DIFFICULTY_CONFIG[selected_difficulty] || DIFFICULTY_CONFIG.beginner;
  let winBonusCoins = 0;
  if (playerWon) {
    winBonusCoins = diffCfg.winBonus;
  }
  const totalEarnedRound = round_answer_coins + winBonusCoins;

  // Update persistent user profile & statistics
  userGameData.coins += totalEarnedRound;
  userGameData.stats.racesPlayed += 1;
  if (playerWon) {
    userGameData.stats.victories += 1;
  }
  userGameData.stats.totalCorrect += round_correct;
  userGameData.stats.totalWrong += round_wrong;
  userGameData.stats.totalDistance += distance;

  save_user_data();

  // Populate Game Over Summary Panel
  const elCorrect = document.getElementById("game_over_correct");
  const elAnswerCoins = document.getElementById("game_over_answer_coins");
  const elWinCoins = document.getElementById("game_over_win_coins");
  const elEarnedCoins = document.getElementById("game_over_earned_coins");
  const elTotalCoins = document.getElementById("game_over_total_coins");

  if (elCorrect) elCorrect.innerText = round_correct;
  if (elAnswerCoins) elAnswerCoins.innerText = `+${round_answer_coins} 🪙`;
  if (elWinCoins) elWinCoins.innerText = playerWon ? `+${winBonusCoins} 🪙` : "0 🪙";
  if (elEarnedCoins) elEarnedCoins.innerText = `+${totalEarnedRound} 🪙`;
  if (elTotalCoins) elTotalCoins.innerText = `${userGameData.coins} 🪙`;

  const raceFinishHeader = document.querySelector(".race-finish");
  if (raceFinishHeader) {
    if (playerWon) {
      raceFinishHeader.innerText = "🏆 Victory! You Won! 🏆";
      raceFinishHeader.style.color = "gold";
    } else {
      raceFinishHeader.innerText = "💥 Defeat! Opponent Won! 💥";
      raceFinishHeader.style.color = "red";
    }
  }
}

// Returns the player to the car selection screen to race again
function restart_game() {
  game_over_view.style.display = "none";
  select_car_view.style.display = "flex";
  render_car_shop();
  
  // Ensure pause elements are visually reset
  document.getElementById("pause_btn").innerText = "⏸️ Pause";
  document.getElementById("paused_overlay").style.display = "none";
}

function back_to_home() {
  game_active = false;
  game_paused = false;
  clearInterval(game_loop_interval);
  clearInterval(timer_interval);
  
  active_game_container.style.display = "none";
  game_over_view.style.display = "none";
  select_car_view.style.display = "none";
  screen_difficulty.style.display = "none";
  game_start_container.style.display = "flex";
}

// Initialize player data on startup
window.addEventListener("DOMContentLoaded", () => {
  load_user_data();
});
load_user_data();