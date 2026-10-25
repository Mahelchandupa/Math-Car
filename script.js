// --- DOM Element Selectors ---
const game_start_container = document.getElementById("game_start_container");
const select_car_view = document.getElementById("select_car_view");
const active_game_container = document.getElementById("active_game_container");
const game_over_view = document.getElementById("game_over_view");
const screen_difficulty = document.getElementById("screen_difficulty");
const screen_levels = document.getElementById("screen_levels");

const math_questions_view = document.getElementById("math_questions_view");
const question_text = document.getElementById("question_text");
const game_timer = document.getElementById("game_timer");

const distance_hud = document.getElementById("distance_hud");
const speed_hud = document.getElementById("speed_hud");
const player_car = document.getElementById("player_car");
const final_distance = document.getElementById("final_distance");
const defeating_car = document.getElementById("defeating_car");

const road_line_container = document.querySelector(".road_line_container");
const obstacle_container = document.getElementById("obstacle_container");
const traffic_container = document.getElementById("traffic_container");
const track_opponents_container = document.getElementById("track_opponents_container");
const start_line = document.getElementById("start_line");
const weather_canvas = document.getElementById("weather_canvas");
const game_view = document.getElementById("game_view");

const your_coin_txt = document.getElementById("your_coin_txt");

// Obstacle pool for introductory tracks: cones, tires, potholes, oil
const base_obstacle_items = [
  "assets/obstacle_1.png",
  "assets/obstacle_2.png",
  "assets/obstacle_1.png",
];

// Difficulty Profiles (Beginner vs. Intermediate vs. Advanced)
const DIFFICULTY_PROFILES = {
  beginner: {
    id: "beginner",
    name: "Beginner",
    baseSpeed: 30, // 100 KM/H
    maxSpeedBonus: 170,
    correctCoins: 10,
    winBonus: 50,
    streakBonus: 10
  },
  intermediate: {
    id: "intermediate",
    name: "Intermediate",
    baseSpeed: 40, // 120 KM/H
    maxSpeedBonus: 260,
    correctCoins: 20,
    winBonus: 120,
    streakBonus: 15
  },
  advanced: {
    id: "advanced",
    name: "Advanced",
    baseSpeed: 60, // 140 KM/H (Less reaction time for obstacles & traffic)
    maxSpeedBonus: 340,
    correctCoins: 35,
    winBonus: 250,
    streakBonus: 25
  }
};

// Level Specific Configurations (Level 1 to 5)
// Opponents are placed at the Starting Line alongside the player.
// Speeds are calibrated as a ratio of baseSpeed so the player has a realistic opportunity
// to win without having to answer every single math problem perfectly.
const LEVEL_CONFIGS = {
  1: {
    level: 1,
    name: "Level 1",
    topic: "Addition",
    finishDistance: 1500,
    obstacleRate: 0.007,
    curveAmplitude: 0,
    hasRain: false,
    // 0 Opponents (Introductory track solo race against the clock)
    opponentRoster: []
  },
  2: {
    level: 2,
    name: "Level 2",
    topic: "Subtraction",
    finishDistance: 2000,
    obstacleRate: 0.012,
    curveAmplitude: 0,
    hasRain: false,
    // 1 Opponent car at the starting line (Left Lane)
    opponentRoster: [
      { id: "opp_1", sprite: "assets/opponent_car_1.png", lane: 0, baseLanePercent: 22, speedRatio: 0.88, startOffset: 0 }
    ]
  },
  3: {
    level: 3,
    name: "Level 3",
    topic: "Multiplication",
    finishDistance: 2500,
    obstacleRate: 0.015,
    curveAmplitude: 45, // sin curve ±45px
    hasRain: false,
    // 2 Opponent cars (Left and Right Lanes with grid stagger)
    opponentRoster: [
      { id: "opp_1", sprite: "assets/opponent_car_1.png", lane: 0, baseLanePercent: 22, speedRatio: 0.87, startOffset: 0 },
      { id: "opp_2", sprite: "assets/opponent_car_2.png", lane: 2, baseLanePercent: 78, speedRatio: 0.91, startOffset: 16 }
    ]
  },
  4: {
    level: 4,
    name: "Level 4",
    topic: "Division",
    finishDistance: 3500,
    obstacleRate: 0.015,
    curveAmplitude: 0,
    hasRain: true, // Heavy Rain storm visual distraction
    // 3 Opponent cars in distinct lanes & staggered starting grid
    opponentRoster: [
      { id: "opp_1", sprite: "assets/opponent_car_1.png", lane: 0, baseLanePercent: 20, speedRatio: 0.88, startOffset: 0 },
      { id: "opp_2", sprite: "assets/opponent_car_2.png", lane: 1, baseLanePercent: 47, speedRatio: 0.91, startOffset: 16 },
      { id: "opp_3", sprite: "assets/opponent_car_3.png", lane: 2, baseLanePercent: 78, speedRatio: 0.94, startOffset: 32 }
    ]
  },
  5: {
    level: 5,
    name: "Level 5",
    topic: "Mixed & Squares (Boss)",
    finishDistance: 3500,
    obstacleRate: 0.015,
    curveAmplitude: 90, // Boss Race & Extreme Curves ±90px
    hasRain: false,
    // Boss Race: 5 distinct opponents across 4 lanes & staggered grid positions (no cars stacked!)
    opponentRoster: [
      { id: "opp_boss", sprite: "assets/opponent_car_1.png", lane: 1, baseLanePercent: 48, speedRatio: 0.95, startOffset: 32, isBoss: true },
      { id: "opp_1", sprite: "assets/opponent_car_2.png", lane: 0, baseLanePercent: 18, speedRatio: 0.88, startOffset: 0 },
      { id: "opp_2", sprite: "assets/opponent_car_3.png", lane: 2, baseLanePercent: 78, speedRatio: 0.90, startOffset: 12 },
      { id: "opp_4", sprite: "assets/opponent_car_4.png", lane: 0, baseLanePercent: 28, speedRatio: 0.92, startOffset: 45 },
      { id: "opp_5", sprite: "assets/opponent_car_5.png", lane: 2, baseLanePercent: 68, speedRatio: 0.93, startOffset: 58 }
    ]
  }
};

// --- LocalStorage State Management & Economy Configuration ---
const STORAGE_KEY = "math_race_game_data_v1";

const CAR_CATALOG = [
  { id: "car_1", name: "Red Thunder", src: "assets/player_car_1.png", price: 0 },
  { id: "car_2", name: "White Angel", src: "assets/player_car_2.png", price: 300 },
  { id: "car_3", name: "Cyber Speed", src: "assets/player_car_3.png", price: 750 },
  { id: "car_4", name: "Blue Streak", src: "assets/player_car_4.png", price: 1000 },
  { id: "car_5", name: "Zonda ZR", src: "assets/player_car_5.png", price: 2000 },
  { id: "car_6", name: "Fire Rider", src: "assets/player_car_6.png", price: 3000 },
  { id: "car_7", name: "White night", src: "assets/player_car_7.png", price: 4000 },
  { id: "car_8", name: "Green Venom", src: "assets/player_car_8.png", price: 5000 },
  { id: "car_9", name: "Golden Phantom", src: "assets/player_car_9.png", price: 6000 },
  { id: "car_10", name: "Nigth Flash", src: "assets/player_car_10.png", price: 7000 },
];

// --- 5 Road Track Designs Configuration ---
const ROAD_CATALOG = [
  {
    id: "classic",
    name: "Classic Asphalt",
    themeClass: "road-theme-classic",
    previewClass: "road_preview_classic",
    desc: "Sandy clay shoulders & yellow dashes",
    price: 0
  },
  {
    id: "neon_night",
    name: "Neon Nightway",
    themeClass: "road-theme-neon_night",
    previewClass: "road_preview_neon_night",
    desc: "Midnight black, cyber pink & cyan glow",
    price: 350
  },
  {
    id: "cyber_matrix",
    name: "Cyber Matrix",
    themeClass: "road-theme-cyber_matrix",
    previewClass: "road_preview_cyber_matrix",
    desc: "Deep tech dark green & radioactive laser line",
    price: 600
  },
  {
    id: "sunset_highway",
    name: "Sunset Highway",
    themeClass: "road-theme-sunset_highway",
    previewClass: "road_preview_sunset_highway",
    desc: "Twilight purple asphalt & blazing orange borders",
    price: 1000
  },
  {
    id: "frozen_glacier",
    name: "Frozen Glacier",
    themeClass: "road-theme-frozen_glacier",
    previewClass: "road_preview_frozen_glacier",
    desc: "Sub-zero ice road & crystal white neon lanes",
    price: 1500
  }
];

let userGameData = {
  coins: 0,
  selectedCarId: "car_1",
  unlockedCars: ["car_1"],
  selectedRoadId: "classic",
  unlockedRoads: ["classic"],
  unlockedLevels: {
    beginner: [1],
    intermediate: [1],
    advanced: [1]
  },
  stats: {
    racesPlayed: 0,
    victories: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalDistance: 0
  }
};

function apply_road_theme(roadId) {
  if (!game_view) return;
  const roadObj = ROAD_CATALOG.find(r => r.id === roadId) || ROAD_CATALOG[0];
  // Remove all previous theme classes
  ROAD_CATALOG.forEach(r => {
    game_view.classList.remove(r.themeClass);
  });
  game_view.classList.add(roadObj.themeClass);
}

function load_user_data() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      userGameData = {
        coins: typeof parsed.coins === "number" ? parsed.coins : 0,
        selectedCarId: parsed.selectedCarId || "car_1",
        unlockedCars: Array.isArray(parsed.unlockedCars) ? parsed.unlockedCars : ["car_1"],
        selectedRoadId: parsed.selectedRoadId || "classic",
        unlockedRoads: Array.isArray(parsed.unlockedRoads) ? parsed.unlockedRoads : ["classic"],
        unlockedLevels: {
          beginner: Array.isArray(parsed.unlockedLevels?.beginner) ? parsed.unlockedLevels.beginner : [1],
          intermediate: Array.isArray(parsed.unlockedLevels?.intermediate) ? parsed.unlockedLevels.intermediate : [1],
          advanced: Array.isArray(parsed.unlockedLevels?.advanced) ? parsed.unlockedLevels.advanced : [1]
        },
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
  apply_road_theme(userGameData.selectedRoadId);
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
let speed = 30;            // Starting speed in km/h
let distance = 0;          // Starting distance in meters
let defeat_speed = 50;     // Defeating/Boss car speed in km/h
let defeat_distance = 0;   // Defeating/Boss car distance in meters
let question_time_left = 10;
let correct_answer = 0;
let game_active = false;
let game_paused = false;
let finish_distance = 1500;
let max_speed = 160;
let defeat_max_speed = 140;

let game_loop_interval = null;
let timer_interval = null;
let lane = 1;              // Car position lane (0 = Left, 1 = Middle, 2 = Right)
let defeat_collision_cooldown = false;

// Environmental, Track & Opponents System State
let road_curve_time = 0;
let current_road_offset = 0;
let active_opponents = []; // Level-configured opponent cars racing on track from the starting line
let rain_particles = [];
let weather_anim_frame = null;

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

// --- Car Shop & Swiper Dynamic Rendering ---
let carShopSwiper = null;

function init_or_update_car_swiper() {
  if (typeof Swiper === "undefined") return;

  const initialIndex = CAR_CATALOG.findIndex(c => c.id === userGameData.selectedCarId);
  const targetIndex = initialIndex >= 0 ? initialIndex : 0;

  if (!carShopSwiper) {
    carShopSwiper = new Swiper(".carShopSwiper", {
      slidesPerView: 1,
      spaceBetween: 16,
      grabCursor: true,
      centeredSlides: false,
      initialSlide: targetIndex,
      pagination: {
        el: ".car-shop-pagination",
        clickable: true,
      },
      navigation: {
        nextEl: ".car-shop-next",
        prevEl: ".car-shop-prev",
      },
      breakpoints: {
        480: {
          slidesPerView: 2,
          spaceBetween: 16,
        },
        720: {
          slidesPerView: 3,
          spaceBetween: 20,
        },
      },
      observer: true,
      observeParents: true,
    });
  } else {
    carShopSwiper.update();
  }

  setTimeout(() => {
    if (carShopSwiper) {
      carShopSwiper.update();
      if (typeof targetIndex === "number" && targetIndex >= 0) {
        carShopSwiper.slideTo(targetIndex, 300);
      }
    }
  }, 50);
}

function render_car_shop() {
  const container = document.getElementById("car_shop_container");
  if (!container) return;
  container.innerHTML = "";

  CAR_CATALOG.forEach((car, index) => {
    const isUnlocked = userGameData.unlockedCars.includes(car.id);
    const isSelected = userGameData.selectedCarId === car.id;
    const canAfford = userGameData.coins >= car.price;

    const slide = document.createElement("div");
    slide.className = "swiper-slide";

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

    slide.appendChild(card);
    container.appendChild(slide);
  });

  init_or_update_car_swiper();
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
  apply_road_theme(userGameData.selectedRoadId);
  select_car_view.style.display = "none";
  screen_difficulty.style.display = "flex";
}

// --- Road Shop & Swiper Dynamic Rendering ---
let roadShopSwiper = null;

function init_or_update_road_swiper() {
  if (typeof Swiper === "undefined") return;

  const initialIndex = ROAD_CATALOG.findIndex(r => r.id === userGameData.selectedRoadId);
  const targetIndex = initialIndex >= 0 ? initialIndex : 0;

  if (!roadShopSwiper) {
    roadShopSwiper = new Swiper(".roadShopSwiper", {
      slidesPerView: 1,
      spaceBetween: 16,
      grabCursor: true,
      centeredSlides: false,
      initialSlide: targetIndex,
      pagination: {
        el: ".road-shop-pagination",
        clickable: true,
      },
      navigation: {
        nextEl: ".road-shop-next",
        prevEl: ".road-shop-prev",
      },
      breakpoints: {
        480: {
          slidesPerView: 2,
          spaceBetween: 16,
        },
        720: {
          slidesPerView: 3,
          spaceBetween: 20,
        },
      },
      observer: true,
      observeParents: true,
    });
  } else {
    roadShopSwiper.update();
  }

  setTimeout(() => {
    if (roadShopSwiper) {
      roadShopSwiper.update();
      if (typeof targetIndex === "number" && targetIndex >= 0) {
        roadShopSwiper.slideTo(targetIndex, 300);
      }
    }
  }, 50);
}

function render_road_shop() {
  const container = document.getElementById("road_shop_container");
  if (!container) return;
  container.innerHTML = "";

  ROAD_CATALOG.forEach(road => {
    const isUnlocked = userGameData.unlockedRoads.includes(road.id);
    const isSelected = userGameData.selectedRoadId === road.id;
    const canAfford = userGameData.coins >= road.price;

    const slide = document.createElement("div");
    slide.className = "swiper-slide";

    const card = document.createElement("div");
    card.className = `road_card ${isSelected ? "selected" : ""} ${!isUnlocked ? "locked" : ""}`;

    let buttonHtml = "";
    if (isSelected) {
      buttonHtml = `<button class="car_action_btn btn_selected" disabled>Equipped ✓</button>`;
    } else if (isUnlocked) {
      buttonHtml = `<button class="car_action_btn btn_select" onclick="choose_road('${road.id}')">Equip</button>`;
    } else {
      buttonHtml = `<button class="car_action_btn btn_buy" ${canAfford ? "" : "disabled"} onclick="buy_road('${road.id}')">
        ${canAfford ? `Buy 🪙 ${road.price}` : `Need 🪙 ${road.price}`}
      </button>`;
    }

    card.innerHTML = `
      <div class="road_preview_wrapper">
        <div class="road_preview_track ${road.previewClass}">
          <div class="mini_dash" style="left: 30%;"></div>
          <div class="mini_dash" style="right: 30%;"></div>
        </div>
        ${!isUnlocked ? `<div class="lock_overlay_badge">🔒</div>` : ""}
      </div>
      <div class="car_title_name">${road.name}</div>
      <div style="font-size: 11px; color: #8b949e; text-align: center; margin: 3px 0 6px 0; min-height: 28px;">${road.desc}</div>
      <div class="car_price_tag">${road.price === 0 ? "FREE" : `🪙 ${road.price}`}</div>
      ${buttonHtml}
    `;

    if (isUnlocked && !isSelected) {
      card.addEventListener("click", (e) => {
        if (!e.target.classList.contains("car_action_btn")) {
          choose_road(road.id);
        }
      });
    }

    slide.appendChild(card);
    container.appendChild(slide);
  });

  init_or_update_road_swiper();
}

function choose_road(roadId) {
  userGameData.selectedRoadId = roadId;
  apply_road_theme(roadId);
  save_user_data();
  render_road_shop();
}

function buy_road(roadId) {
  const road = ROAD_CATALOG.find(r => r.id === roadId);
  if (!road) return;

  if (userGameData.coins < road.price) {
    alert("Not enough coins! Win races and solve math questions to earn more.");
    return;
  }

  userGameData.coins -= road.price;
  userGameData.unlockedRoads.push(roadId);
  userGameData.selectedRoadId = roadId;
  apply_road_theme(roadId);

  save_user_data();
  render_road_shop();
}

// --- Store Tabs Switching ---
let current_store_tab = "cars";

function switch_store_tab(tab) {
  current_store_tab = tab;
  const tabCarsBtn = document.getElementById("tab_btn_cars");
  const tabRoadsBtn = document.getElementById("tab_btn_roads");
  const tabCarsContent = document.getElementById("store_tab_cars_content");
  const tabRoadsContent = document.getElementById("store_tab_roads_content");

  if (tab === "cars") {
    if (tabCarsBtn) tabCarsBtn.classList.add("active");
    if (tabRoadsBtn) tabRoadsBtn.classList.remove("active");
    if (tabCarsContent) tabCarsContent.style.display = "flex";
    if (tabRoadsContent) tabRoadsContent.style.display = "none";
    render_car_shop();
  } else {
    if (tabRoadsBtn) tabRoadsBtn.classList.add("active");
    if (tabCarsBtn) tabCarsBtn.classList.remove("active");
    if (tabRoadsContent) tabRoadsContent.style.display = "flex";
    if (tabCarsContent) tabCarsContent.style.display = "none";
    render_road_shop();
  }
}

function open_store() {
  game_start_container.style.display = "none";
  select_car_view.style.display = "flex";
  
  const title = document.getElementById("store_title");
  if (title) title.innerText = "Game Store & Garage";
  
  const continueBtn = document.getElementById("store_continue_btn");
  if (continueBtn) continueBtn.innerText = "Continue to Race 🏁";
  
  switch_store_tab("cars");
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
  const roadsOwnedEl = document.getElementById("stat_roads_owned");
  if (roadsOwnedEl) {
    roadsOwnedEl.innerText = `${(userGameData.unlockedRoads || []).length} / ${ROAD_CATALOG.length}`;
  }

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
      selectedRoadId: "classic",
      unlockedRoads: ["classic"],
      unlockedLevels: {
        beginner: [1],
        intermediate: [1],
        advanced: [1]
      },
      stats: {
        racesPlayed: 0,
        victories: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalDistance: 0
      }
    };
    apply_road_theme("classic");
    save_user_data();
    open_stats();
    render_car_shop();
    render_road_shop();
  }
}

// --- Game View Transitions ---

// --- Game View Transitions & Level Selection ---

let selected_difficulty = "beginner"; // "beginner" | "intermediate" | "advanced"
let selected_level = 1;              // 1 to 5

// Step 1: Start Game button clicked - show Store / Car Selection screen
function start_game() {
  open_store();
}

// Step 2: Car chosen - set car image source, show difficulty selection screen
function select_car(carSrc) {
  player_car.src = carSrc;
  apply_road_theme(userGameData.selectedRoadId);
  select_car_view.style.display = "none";
  screen_difficulty.style.display = "flex";
}

function set_difficulty(cardElement, diff) {
  selected_difficulty = diff;
  const cards = document.querySelectorAll("#screen_difficulty .difficulty-card");
  cards.forEach(card => card.classList.remove("selected"));
  if (cardElement) {
    cardElement.classList.add("selected");
  }
}

function back_to_car_select() {
  screen_difficulty.style.display = "none";
  open_store();
}

// Step 3: From Difficulty Selection, proceed to Level Selection (1 to 5)
function confirm_difficulty_selection() {
  screen_difficulty.style.display = "none";
  screen_levels.style.display = "flex";

  const diffTitle = document.getElementById("levels_diff_title");
  if (diffTitle) {
    diffTitle.innerText = selected_difficulty.charAt(0).toUpperCase() + selected_difficulty.slice(1);
  }

  const tagIndicator = document.getElementById("diff_tag_indicator");
  if (tagIndicator) {
    tagIndicator.className = `diff-badge ${selected_difficulty === "beginner" ? "beg" : selected_difficulty === "intermediate" ? "int" : "adv"}`;
    tagIndicator.innerText = selected_difficulty.toUpperCase();
  }

  // Ensure default level 1 or currently unlocked level is selected
  const unlocked = get_unlocked_levels_for_diff(selected_difficulty);
  if (!unlocked.includes(selected_level)) {
    selected_level = 1;
  }

  render_level_cards();
}

function back_to_difficulty_select() {
  screen_levels.style.display = "none";
  screen_difficulty.style.display = "flex";
}

function get_unlocked_levels_for_diff(diff) {
  if (!userGameData.unlockedLevels) {
    userGameData.unlockedLevels = { beginner: [1], intermediate: [1], advanced: [1] };
  }
  if (!Array.isArray(userGameData.unlockedLevels[diff])) {
    userGameData.unlockedLevels[diff] = [1];
  }
  return userGameData.unlockedLevels[diff];
}

function render_level_cards() {
  const container = document.getElementById("levels_container");
  if (!container) return;
  container.innerHTML = "";

  const unlocked = get_unlocked_levels_for_diff(selected_difficulty);

  for (let lvl = 1; lvl <= 5; lvl++) {
    const lvlCfg = LEVEL_CONFIGS[lvl];
    const isUnlocked = unlocked.includes(lvl);
    const isSelected = selected_level === lvl && isUnlocked;

    const card = document.createElement("div");
    card.className = `difficulty-card ${isSelected ? "selected" : ""} ${!isUnlocked ? "locked" : ""}`;
    card.dataset.level = lvl;

    let subDesc = "";
    if (lvl === 1) subDesc = "Straight open road with simple road cones. Warm up your wheels!";
    else if (lvl === 2) subDesc = "Your first head-to-head race! Pass the rival car to win.";
    else if (lvl === 3) subDesc = "Twisting windy turns with roadblocks and 2 speedy rival cars.";
    else if (lvl === 4) subDesc = "Heavy stormy rain with slippery asphalt and 3 rival racers.";
    else if (lvl === 5) subDesc = "The Championship Boss race! Full pack of 5 cars and sharp hairpin curves.";

    card.innerHTML = `
      <span class="diff-badge lvl-${lvl}">${lvl === 5 ? "Level 5 (Boss)" : `Level ${lvl}`}</span>
      <div class="diff-age">${lvlCfg.topic}</div>
      <div class="diff-target">${lvlCfg.finishDistance.toLocaleString()}m</div>
      <p style="color: var(--text-muted); font-size: 12px; margin-bottom: 8px;">${subDesc}</p>
      ${!isUnlocked ? `<div class="level-lock-badge">🔒 Locked</div>` : `<div style="color: #3fb950; font-size: 12px; font-weight: bold;">Unlocked ✓</div>`}
    `;

    if (isUnlocked) {
      card.addEventListener("click", () => {
        selected_level = lvl;
        render_level_cards();
      });
    }

    container.appendChild(card);
  }
}

function start_race_with_level() {
  const unlocked = get_unlocked_levels_for_diff(selected_difficulty);
  if (!unlocked.includes(selected_level)) {
    alert("This level is locked! Win the previous level to unlock it.");
    return;
  }

  screen_levels.style.display = "none";
  active_game_container.style.display = "flex";

  const diffProfile = DIFFICULTY_PROFILES[selected_difficulty] || DIFFICULTY_PROFILES.beginner;
  const lvlCfg = LEVEL_CONFIGS[selected_level] || LEVEL_CONFIGS[1];

  finish_distance = lvlCfg.finishDistance;
  // Base Cruising Speed based on chosen difficulty: Beginner: 100, Intermediate: 120, Advanced: 140
  speed = diffProfile.baseSpeed;
  max_speed = diffProfile.baseSpeed + diffProfile.maxSpeedBonus;
  defeat_speed = diffProfile.baseSpeed + 10;
  defeat_max_speed = max_speed - 15;
  question_time_left = 10;

  // Update HUD displays
  const levelHudBadge = document.getElementById("level_hud_badge");
  if (levelHudBadge) {
    levelHudBadge.innerText = `${diffProfile.name.toUpperCase()} • ${lvlCfg.name.toUpperCase()} (${lvlCfg.topic.toUpperCase()})`;
  }

  const targetDistHud = document.getElementById("target_dist_hud");
  if (targetDistHud) {
    targetDistHud.innerText = finish_distance;
  }

  const max_speed_hud = document.getElementById("max_speed_hud");
  if (max_speed_hud) {
    max_speed_hud.innerText = max_speed;
  }

  init_game();
}

// --- Weather Hazards Engine (Heavy Rain Storm for Level 4) ---
function init_weather() {
  stop_weather();
  const lvlCfg = LEVEL_CONFIGS[selected_level] || LEVEL_CONFIGS[1];
  if (!weather_canvas || !game_view) return;

  if (!lvlCfg.hasRain) {
    weather_canvas.style.display = "none";
    game_view.classList.remove("weather-storm-active");
    return;
  }

  weather_canvas.style.display = "block";
  game_view.classList.add("weather-storm-active");

  weather_canvas.width = game_view.clientWidth || 700;
  weather_canvas.height = game_view.clientHeight || 480;

  // Generate 120 rain droplets
  rain_particles = [];
  for (let i = 0; i < 120; i++) {
    rain_particles.push({
      x: Math.random() * weather_canvas.width,
      y: Math.random() * weather_canvas.height,
      length: Math.random() * 22 + 12,
      speed: Math.random() * 12 + 18,
      thickness: Math.random() * 1.5 + 0.8,
      opacity: Math.random() * 0.5 + 0.3
    });
  }

  const ctx = weather_canvas.getContext("2d");

  function draw_rain() {
    if (!game_active) return;
    ctx.clearRect(0, 0, weather_canvas.width, weather_canvas.height);

    ctx.strokeStyle = "rgba(180, 215, 255, 0.65)";
    ctx.lineWidth = 1.2;

    for (let i = 0; i < rain_particles.length; i++) {
      const p = rain_particles[i];
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 3, p.y + p.length);
      ctx.stroke();

      p.y += p.speed + (speed / 20);
      p.x -= 1.5;

      if (p.y > weather_canvas.height) {
        p.y = -p.length;
        p.x = Math.random() * (weather_canvas.width + 50);
      }
    }

    weather_anim_frame = requestAnimationFrame(draw_rain);
  }

  draw_rain();
}

function stop_weather() {
  if (weather_anim_frame) {
    cancelAnimationFrame(weather_anim_frame);
    weather_anim_frame = null;
  }
  if (weather_canvas) {
    const ctx = weather_canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, weather_canvas.width, weather_canvas.height);
    weather_canvas.style.display = "none";
  }
  if (game_view) {
    game_view.classList.remove("weather-storm-active");
  }
}

// --- Dynamic Road Curvature System (Level 3: ±45px, Level 5: ±90px) ---
function update_road_curvature() {
  const lvlCfg = LEVEL_CONFIGS[selected_level] || LEVEL_CONFIGS[1];
  if (lvlCfg.curveAmplitude > 0) {
    road_curve_time += 0.04 * (speed / 40);
    current_road_offset = Math.sin(road_curve_time) * lvlCfg.curveAmplitude;
  } else {
    current_road_offset = 0;
  }

  if (road_line_container) {
    road_line_container.style.transform = `translateX(${current_road_offset}px)`;
  }
}

// --- Obstacle & Roadblock Spawning System ---
const handle_obstacle = () => {
  if (!obstacle_container) return;
  const lvlCfg = LEVEL_CONFIGS[selected_level] || LEVEL_CONFIGS[1];

  // Spawn check using configured obstacle rate (per tick)
  if (Math.random() < lvlCfg.obstacleRate) {
    const obs = document.createElement("img");

    // Level 3+ introduces harder roadblocks
    if (lvlCfg.level >= 3 && Math.random() < 0.45) {
      obs.src = "assets/obstacle_2.png"; // Roadblock
      obs.classList.add("obstacle", "obstacle-roadblock");
      obs.style.width = "85px";
      obs.style.height = "75px";
    } else {
      obs.src = base_obstacle_items[Math.floor(Math.random() * base_obstacle_items.length)];
      obs.classList.add("obstacle");
      obs.style.width = "65px";
      obs.style.height = "65px";
    }

    // Spawn across road width factoring curve offset
    const spawnPercent = Math.random() * 65 + 15;
    obs.style.left = `calc(${spawnPercent}% + ${current_road_offset * 0.5}px)`;
    obs.style.top = "-12%";
    obstacle_container.appendChild(obs);
  }

  // Move active obstacles down the road
  const obstacles = obstacle_container.querySelectorAll(".obstacle");
  obstacles.forEach(obs => {
    let topVal = parseFloat(obs.style.top) || 0;
    topVal += (speed / 20);
    if (topVal >= 115) {
      obs.remove();
    } else {
      obs.style.top = topVal + "%";
    }
  });

  handle_obstacle_collision();
};

// --- Starting Grid Opponents Racing System ---
// Opponent cars are positioned alongside the player at the starting line.
// Each opponent car moves along the track at its own balanced cruising speed.
// Speeds are calibrated to allow players to win without answering 100% of math problems.

function setup_opponents() {
  if (!track_opponents_container) return;
  track_opponents_container.innerHTML = "";
  active_opponents = [];

  const lvlCfg = LEVEL_CONFIGS[selected_level] || LEVEL_CONFIGS[1];
  const diffProfile = DIFFICULTY_PROFILES[selected_difficulty] || DIFFICULTY_PROFILES.beginner;
  const roster = lvlCfg.opponentRoster || [];

  roster.forEach(item => {
    const img = document.createElement("img");
    img.src = item.sprite;
    img.className = `grid_opponent_car ${item.isBoss ? "boss-car" : ""}`;
    img.alt = item.id;

    // Start with car aligned with player at the starting line (screen bottom: 20px)
    img.style.bottom = "20px";
    img.style.left = `${item.baseLanePercent}%`;

    track_opponents_container.appendChild(img);

    // Baseline cruising speed configured as a ratio of the difficulty baseSpeed
    const baseOpponentSpeed = diffProfile.baseSpeed * item.speedRatio;

    active_opponents.push({
      id: item.id,
      element: img,
      baseLane: item.baseLanePercent,
      speed: baseOpponentSpeed,
      baseSpeed: baseOpponentSpeed,
      speedRatio: item.speedRatio,
      distance: -(item.startOffset || 0), // Starting offset in meters behind/ahead on grid
      isBoss: !!item.isBoss,
      hitCooldown: false
    });
  });
}

function handle_opponents() {
  if (!track_opponents_container) return;
  const targetBottom = parseFloat(player_car.style.bottom) || 20;

  // AI Collision Avoidance & Overtaking between opponent cars:
  // If a faster opponent car gets too close behind another opponent, it gently eases speed
  // or offsets slightly to avoid driving directly on top of the car ahead
  for (let i = 0; i < active_opponents.length; i++) {
    for (let j = 0; j < active_opponents.length; j++) {
      if (i === j) continue;
      const oppA = active_opponents[i]; // follower or leader
      const oppB = active_opponents[j]; // other car

      // Check if they are in similar horizontal lane space
      const laneDist = Math.abs(oppA.baseLane - oppB.baseLane);
      if (laneDist < 12) {
        const distDiff = oppB.distance - oppA.distance; // oppB is ahead of oppA
        // If oppA is close behind oppB (between 0 and 18 meters)
        if (distDiff > 0 && distDiff < 18) {
          // Opponent A yields speed slightly to match or stay behind Opponent B
          if (oppA.speed > oppB.speed) {
            oppA.speed = oppB.speed * 0.98;
          }
        }
      }
    }
  }

  for (let i = 0; i < active_opponents.length; i++) {
    const opp = active_opponents[i];

    // Increase opponent distance traveled
    opp.distance += opp.speed * 0.015;

    // Relative distance compared to player determines screen bottom position
    // (4px per meter provides visual depth consistency)
    const distanceDiff = opp.distance - distance;
    const oppScreenBottom = targetBottom + (distanceDiff * 4);

    if (opp.element) {
      // If far behind off-screen bottom (< -180px) or far ahead (> 800px), hide or show appropriately
      if (oppScreenBottom < -180 || oppScreenBottom > 750) {
        opp.element.style.display = "none";
      } else {
        opp.element.style.display = "block";
        opp.element.style.bottom = `${oppScreenBottom}px`;
        
        // Road curvature influence
        const curveFactor = opp.isBoss ? 0.7 : 0.45;
        opp.element.style.left = `calc(${opp.baseLane}% + ${current_road_offset * curveFactor}px)`;
      }
    }

    // Check collision between player car and opponent
    handle_single_opponent_collision(opp);

    // If any opponent crosses the finish line before the player, player loses immediately!
    if (opp.distance >= finish_distance && distance < finish_distance) {
      end_game(false);
      return;
    }
  }
}

function handle_single_opponent_collision(opp) {
  if (!game_active || game_paused || !player_car || !opp.element || opp.hitCooldown || defeat_collision_cooldown) return;
  if (opp.element.style.display === "none") return;

  const playerRect = player_car.getBoundingClientRect();
  const oppRect = opp.element.getBoundingClientRect();
  if (playerRect.width === 0 || oppRect.width === 0) return;

  const pBox = {
    top: playerRect.top + 15,
    bottom: playerRect.bottom - 15,
    left: playerRect.left + 15,
    right: playerRect.right - 15
  };

  const cBox = {
    top: oppRect.top + 12,
    bottom: oppRect.bottom - 12,
    left: oppRect.left + 12,
    right: oppRect.right - 12
  };

  const isColliding = !(
    pBox.right < cBox.left ||
    pBox.left > cBox.right ||
    pBox.bottom < cBox.top ||
    pBox.top > cBox.bottom
  );

  if (isColliding) {
    opp.hitCooldown = true;
    defeat_collision_cooldown = true;

    // Collision slows player down
    speed = Math.max(speed - 20, 15);
    speed_hud.innerText = Math.floor(speed);

    player_car.classList.remove("car-hit");
    void player_car.offsetWidth;
    player_car.classList.add("car-hit");
    player_car.style.opacity = "0.6";

    setTimeout(() => {
      player_car.classList.remove("car-hit");
    }, 450);

    setTimeout(() => {
      player_car.style.opacity = "1";
      defeat_collision_cooldown = false;
      opp.hitCooldown = false;
    }, 1200);
  }
}

// Handles collision between player car and obstacles
function handle_obstacle_collision() {
  if (!game_active || game_paused || !player_car || !obstacle_container) return;

  const playerRect = player_car.getBoundingClientRect();
  if (playerRect.width === 0 || playerRect.height === 0) return;

  const playerHitbox = {
    top: playerRect.top + 15,
    bottom: playerRect.bottom - 15,
    left: playerRect.left + 15,
    right: playerRect.right - 15,
  };

  const obstacles = obstacle_container.querySelectorAll(".obstacle");
  obstacles.forEach(obs => {
    if (obs.dataset.hit === "true" || obs.style.display === "none") return;

    const obsRect = obs.getBoundingClientRect();
    if (obsRect.width === 0 || obsRect.height === 0) return;

    const obsHitbox = {
      top: obsRect.top + 10,
      bottom: obsRect.bottom - 10,
      left: obsRect.left + 10,
      right: obsRect.right - 10,
    };

    const isColliding = !(
      playerHitbox.right < obsHitbox.left ||
      playerHitbox.left > obsHitbox.right ||
      playerHitbox.bottom < obsHitbox.top ||
      playerHitbox.top > obsHitbox.bottom
    );

    if (isColliding) {
      obs.dataset.hit = "true";
      obs.style.display = "none";
      obs.remove();

      // Roadblocks cause slightly higher penalty
      const isRoadblock = obs.classList.contains("obstacle-roadblock");
      const penalty = isRoadblock ? 18 : 10;
      speed = Math.max(speed - penalty, 20);
      speed_hud.innerText = Math.floor(speed);

      player_car.classList.remove("car-hit");
      void player_car.offsetWidth;
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

  const diffProfile = DIFFICULTY_PROFILES[selected_difficulty] || DIFFICULTY_PROFILES.beginner;
  const lvlCfg = LEVEL_CONFIGS[selected_level] || LEVEL_CONFIGS[1];

  speed = diffProfile.baseSpeed;
  distance = 0;
  defeat_speed = diffProfile.baseSpeed + 8;
  defeat_distance = 0;
  question_time_left = 10;
  lane = 1;
  road_curve_time = 0;
  current_road_offset = 0;

  player_car.style.left = "60%";
  game_timer.innerText = question_time_left + "s";

  // Hide deprecated defeating car element (replaced by starting grid opponent racers)
  if (defeating_car) {
    defeating_car.style.display = "none";
  }

  // Clear any active obstacles and traffic
  obstacle_container.innerHTML = "";
  if (traffic_container) {
    traffic_container.innerHTML = "";
  }
  defeat_collision_cooldown = false;
  player_car.style.opacity = "1";
  player_car.classList.remove("car-hit");

  // Setup starting line at race line position
  if (start_line) {
    start_line.style.display = "block";
    const gameViewHeight = game_view ? game_view.clientHeight : 400;
    // Align with rear of starting cars (targetBottom = 20px, car height = 110px)
    start_line.style.top = (gameViewHeight - 35) + "px";
  }

  // Initialize level-specific opponents on starting grid
  setup_opponents();

  // Reset finish line
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

  // Initialize weather storm (Heavy Rain on Level 4)
  init_weather();

  generate_question();

  clearInterval(game_loop_interval);
  clearInterval(timer_interval);

  // Game Loop runs every 30 milliseconds (~33 FPS)
  game_loop_interval = setInterval(game_loop, 30);

  // Countdown Timer runs every 1 second
  timer_interval = setInterval(update_timer, 1000);
}

// Animates road, curvature, obstacles, traffic, and distance
function game_loop() {
  if (!game_active || game_paused) return;

  const lvlCfg = LEVEL_CONFIGS[selected_level] || LEVEL_CONFIGS[1];

  // 1. Move the road lines downwards to create driving effect
  const lines = document.querySelectorAll(".road_line");
  lines.forEach(line => {
    let topVal = parseFloat(line.style.top) || 0;
    topVal += (speed / 20);
    if (topVal >= 100) {
      topVal = -10;
    }
    line.style.top = topVal + "%";
  });

  // 2. Update road curvature (Level 3 ±45px, Level 5 ±90px)
  update_road_curvature();

  // 3. Update car vertical screen position proportionally based on max_speed
  let speedRatio = Math.min(Math.max((speed - 10) / (max_speed - 10), 0), 1);
  let targetBottom = 20 + (speedRatio * 320);
  player_car.style.bottom = targetBottom + "px";

  // 4. Increase distance driven
  distance += speed * 0.015;

  // 5. Update Starting Line position (scrolls down track and vanishes once past start)
  if (start_line) {
    if (distance <= 45) {
      start_line.style.display = "block";
      const gameViewHeight = game_view ? game_view.clientHeight : 400;
      // At distance = 0, line is at gameViewHeight - 35px; scrolls downward as distance increases
      const lineTop = (gameViewHeight - 35) + (distance * 6);
      start_line.style.top = lineTop + "px";
    } else {
      start_line.style.display = "none";
    }
  }

  // 6. Handle Obstacles (all levels according to spawn rate)
  handle_obstacle();

  // 7. Handle Level Grid Opponents (movement, collisions, and finish check)
  handle_opponents();

  // 8. Update HUD displays
  distance_hud.innerText = Math.floor(distance);
  speed_hud.innerText = Math.floor(speed);

  // 9. Update Finish Line position and check for game completion
  const finish_line = document.getElementById("finish_line");
  if (finish_line) {
    const final_stretch = 100;
    if (distance >= finish_distance - final_stretch) {
      finish_line.style.display = "block";
      const gameViewHeight = game_view ? game_view.clientHeight : 400;
      const endTop = gameViewHeight - targetBottom - 140;
      const startTop = -50;
      const ratio = Math.min((distance - (finish_distance - final_stretch)) / final_stretch, 1);
      const currentTop = startTop + (endTop - startTop) * ratio;
      finish_line.style.top = currentTop + "px";
    } else {
      finish_line.style.display = "none";
    }
  }

  // 10. Check Win/Defeat condition for Player
  // If player reaches finish line first: Victory
  if (distance >= finish_distance) {
    end_game(true); // Player won!
    return;
  }
}

// Counts down game time and ends the game when time runs out
function update_timer() {
  if (game_paused) return;

  question_time_left--;
  game_timer.innerText = question_time_left + "s";

  if (question_time_left <= 0) {
    question_time_left = 10;
    game_timer.innerText = question_time_left + "s";
    generate_question();
  }
}

// Generates math questions based on chosen difficulty AND chosen level
function generate_question() {
  let questionText = "";
  const diff = selected_difficulty; // "beginner" | "intermediate" | "advanced"
  const lvl = selected_level;       // 1 to 5

  // Helper generators for specific operations
  function gen_addition() {
    if (diff === "beginner") {
      // 1–15 + 1–10
      const a = Math.floor(Math.random() * 15) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      return { text: `${a} + ${b}`, ans: a + b };
    } else if (diff === "intermediate") {
      // 12–60 + 10–40
      const a = Math.floor(Math.random() * 49) + 12;
      const b = Math.floor(Math.random() * 31) + 10;
      return { text: `${a} + ${b}`, ans: a + b };
    } else {
      // Advanced: 40–250 + 30–180
      const a = Math.floor(Math.random() * 211) + 40;
      const b = Math.floor(Math.random() * 151) + 30;
      return { text: `${a} + ${b}`, ans: a + b };
    }
  }

  function gen_subtraction() {
    if (diff === "beginner") {
      // 6–20 − 1–(a-1)
      const a = Math.floor(Math.random() * 15) + 6;
      const b = Math.floor(Math.random() * (a - 1)) + 1;
      return { text: `${a} − ${b}`, ans: a - b };
    } else if (diff === "intermediate") {
      // 30–99 − 10–(a-1)
      const a = Math.floor(Math.random() * 70) + 30;
      const maxB = Math.max(10, a - 1);
      const b = Math.floor(Math.random() * (maxB - 10 + 1)) + 10;
      return { text: `${a} − ${b}`, ans: a - b };
    } else {
      // Advanced: 100–300 − 20–(a-1)
      const a = Math.floor(Math.random() * 201) + 100;
      const maxB = Math.max(20, a - 1);
      const b = Math.floor(Math.random() * (maxB - 20 + 1)) + 20;
      return { text: `${a} − ${b}`, ans: a - b };
    }
  }

  function gen_multiplication() {
    if (diff === "beginner") {
      // Times tables up to 5 × 10
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      return { text: `${a} × ${b}`, ans: a * b };
    } else if (diff === "intermediate") {
      // Up to 12 × 12
      const a = Math.floor(Math.random() * 11) + 2;
      const b = Math.floor(Math.random() * 11) + 2;
      return { text: `${a} × ${b}`, ans: a * b };
    } else {
      // Advanced: Double-digit multi-digit products (11–24 × 3–22)
      const a = Math.floor(Math.random() * 14) + 11;
      const b = Math.floor(Math.random() * 20) + 3;
      return { text: `${a} × ${b}`, ans: a * b };
    }
  }

  function gen_division() {
    if (diff === "beginner") {
      // Simple single-digit factors (2–5 divisor, answers 1–10)
      const divisor = Math.floor(Math.random() * 4) + 2;
      const quotient = Math.floor(Math.random() * 10) + 1;
      const dividend = divisor * quotient;
      return { text: `${dividend} ÷ ${divisor}`, ans: quotient };
    } else if (diff === "intermediate") {
      // Dividends up to standard tables (3–11 divisor, answers 2–12)
      const divisor = Math.floor(Math.random() * 9) + 3;
      const quotient = Math.floor(Math.random() * 11) + 2;
      const dividend = divisor * quotient;
      return { text: `${dividend} ÷ ${divisor}`, ans: quotient };
    } else {
      // Advanced: Larger long division (4–16 divisor, answers 5–20)
      const divisor = Math.floor(Math.random() * 13) + 4;
      const quotient = Math.floor(Math.random() * 16) + 5;
      const dividend = divisor * quotient;
      return { text: `${dividend} ÷ ${divisor}`, ans: quotient };
    }
  }

  function gen_squares() {
    // Square Number questions (x² for numbers between 6 and 25)
    const n = Math.floor(Math.random() * 20) + 6;
    return { text: `${n}²`, ans: n * n };
  }

  let qObj;

  if (lvl === 1) {
    qObj = gen_addition();
  } else if (lvl === 2) {
    qObj = gen_subtraction();
  } else if (lvl === 3) {
    qObj = gen_multiplication();
  } else if (lvl === 4) {
    qObj = gen_division();
  } else {
    // Level 5: Mixed & Squares (Boss)
    // In Advanced Mode, 25% chance of encountering Square Number questions
    if (diff === "advanced" && Math.random() < 0.25) {
      qObj = gen_squares();
    } else {
      const opChoice = Math.floor(Math.random() * 4);
      if (opChoice === 0) qObj = gen_addition();
      else if (opChoice === 1) qObj = gen_subtraction();
      else if (opChoice === 2) qObj = gen_multiplication();
      else qObj = gen_division();
    }
  }

  questionText = qObj.text;
  correct_answer = qObj.ans;

  question_text.innerText = questionText;

  // Generate 3 unique choices
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

  choices.sort(() => Math.random() - 0.5);

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
  
  math_questions_view.classList.remove("correct-flash-active", "wrong-flash-active");
  void math_questions_view.offsetWidth;
  
  if (answer === correct_answer) {
    speed = Math.min(speed + 15, max_speed);
    defeat_speed = Math.min(defeat_speed + 15, defeat_max_speed);
    math_questions_view.classList.add("correct-flash-active");

    round_correct++;
    round_streak++;
    
    const diffProfile = DIFFICULTY_PROFILES[selected_difficulty] || DIFFICULTY_PROFILES.beginner;
    let gainedCoins = diffProfile.correctCoins;

    if (round_streak % 3 === 0) {
      gainedCoins += diffProfile.streakBonus;
    }

    round_answer_coins += gainedCoins;
    round_coins_earned += gainedCoins;

    const raceCoinsHud = document.getElementById("race_coins_hud");
    if (raceCoinsHud) {
      raceCoinsHud.innerText = round_coins_earned;
    }

    show_coin_feedback(`+${gainedCoins} 🪙`);
  } else {
    speed = Math.max(speed - 10, 10);
    defeat_speed = Math.max(defeat_speed - 3, 30);
    math_questions_view.classList.add("wrong-flash-active");

    round_wrong++;
    round_streak = 0;
  }
  
  question_time_left = 10;
  game_timer.innerText = question_time_left + "s";

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
    game_paused = false;
    paused_overlay.style.display = "none";
    pause_btn.innerText = "⏸️ Pause";
    
    game_loop_interval = setInterval(game_loop, 30);
    timer_interval = setInterval(update_timer, 1000);
  } else {
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
  stop_weather();
  
  active_game_container.style.display = "none";
  game_over_view.style.display = "flex";
  
  final_distance.innerText = Math.floor(distance);

  const diffProfile = DIFFICULTY_PROFILES[selected_difficulty] || DIFFICULTY_PROFILES.beginner;
  let winBonusCoins = 0;
  if (playerWon) {
    winBonusCoins = diffProfile.winBonus;

    // Unlock next level in current difficulty if available!
    const nextLevel = selected_level + 1;
    if (nextLevel <= 5) {
      if (!userGameData.unlockedLevels) {
        userGameData.unlockedLevels = { beginner: [1], intermediate: [1], advanced: [1] };
      }
      if (!userGameData.unlockedLevels[selected_difficulty]) {
        userGameData.unlockedLevels[selected_difficulty] = [1];
      }
      if (!userGameData.unlockedLevels[selected_difficulty].includes(nextLevel)) {
        userGameData.unlockedLevels[selected_difficulty].push(nextLevel);
        userGameData.unlockedLevels[selected_difficulty].sort((a, b) => a - b);
      }
    }
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
      const unlockNotice = selected_level < 5 ? `<div style="font-size: 16px; color: #58a6ff; margin-top: 6px;">🎉 Level ${selected_level + 1} Unlocked!</div>` : "";
      raceFinishHeader.innerHTML = `🏆 Victory! You Won! 🏆${unlockNotice}`;
      raceFinishHeader.style.color = "gold";
    } else {
      raceFinishHeader.innerText = "💥 Defeat! Opponent Won! 💥";
      raceFinishHeader.style.color = "red";
    }
  }
}

// Returns the player to the level selection screen to race again
function restart_game() {
  stop_weather();
  game_over_view.style.display = "none";
  screen_levels.style.display = "flex";
  render_level_cards();
  
  // Ensure pause elements are visually reset
  document.getElementById("pause_btn").innerText = "⏸️ Pause";
  document.getElementById("paused_overlay").style.display = "none";
}

function back_to_home() {
  game_active = false;
  game_paused = false;
  clearInterval(game_loop_interval);
  clearInterval(timer_interval);
  stop_weather();
  
  active_game_container.style.display = "none";
  game_over_view.style.display = "none";
  select_car_view.style.display = "none";
  screen_difficulty.style.display = "none";
  if (screen_levels) screen_levels.style.display = "none";
  game_start_container.style.display = "flex";
}

// Initialize player data on startup
window.addEventListener("DOMContentLoaded", () => {
  load_user_data();
});
load_user_data();