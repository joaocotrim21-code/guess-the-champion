/**********************
 * STATE
 **********************/
let data;
let currentYear;
let allYears = [];
let userChoices = {};
let resultPattern = [];

const urlParams = new URLSearchParams(window.location.search);
const yearFromUrl = Number(urlParams.get("year"));

/**********************
 * INIT
 **********************/
window.onload = init;

function init() {
  fetchData();
  setupYearControls();
  setupSubmit();
}

/**********************
 * DATA
 **********************/
function fetchData() {
  fetch("data/competitions.json")
    .then(res => res.json())
    .then(json => {
      data = json;
      buildAllYears();
      setInitialYear();
      populateYearSelect();
      renderCards();
    })
    .catch(err => {
      console.error("Erro a carregar dados:", err);
      // opcional: mostrar mensagem ao utilizador
    });
}

function buildAllYears() {
  const CURRENT_YEAR = new Date().getFullYear();
  allYears = [
    ...new Set(
      Object.values(data.competitions)
        .flatMap(c =>
          c.history
            .filter(h =>
              h.winner &&               // só concluídos
              h.year <= CURRENT_YEAR    // não futuristas
            )
            .map(h => h.year)
        )
    )
  ].sort((a, b) => b - a);
}

function setInitialYear() {
  currentYear = allYears.includes(yearFromUrl)
    ? yearFromUrl
    : allYears[0];
}

/**********************
 * YEAR UI
 **********************/
function populateYearSelect() {
  const select = document.getElementById("yearSelect");
  select.innerHTML = "";

  allYears.forEach(year => {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = year;
    select.appendChild(opt);
  });

  select.value = currentYear;

  select.onchange = () => {
    currentYear = Number(select.value);
    renderCards();
  };
}

function setupYearControls() {
  document.getElementById("prevYear").onclick = () => changeYear(1);
  document.getElementById("nextYear").onclick = () => changeYear(-1);
  document.getElementById("randomYear").onclick = randomYear;
}

function changeYear(delta) {
  const i = allYears.indexOf(currentYear);
  const next = allYears[i + delta];
  if (next) {
    currentYear = next;
    renderCards();
    document.getElementById("yearSelect").value = currentYear;
  }
}

function randomYear() {
  const modernYears = allYears.filter(y => y >= 1970);
  currentYear =
    modernYears[Math.floor(Math.random() * modernYears.length)];

  renderCards();
  document.getElementById("yearSelect").value = currentYear;
}

/**********************
 * CARDS
 **********************/
function renderCards() {
  const container = document.getElementById("cards");
  container.innerHTML = "";
  userChoices = {};

  Object.entries(data.competitions).forEach(([code, comp]) => {
    const season = comp.history.find(h => h.year === currentYear);
    if (!season) return;

    const card = createCard(comp, code, season);
    container.appendChild(card);
  });
}

function createCard(comp, code, season) {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <div class="card-header">
      <img class="icon" src="${comp.icon}" />
      <h3>${comp.name}</h3>
      <div class="season-label">${season.season}</div>
    </div>

    <div class="pick-display">
      <span class="placeholder">Pick</span>
    </div>

    <div class="club-list hidden"></div>
  `;

  const display = card.querySelector(".pick-display");
  const list = card.querySelector(".club-list");

  const clubs = Object.keys(comp.totals || {});
  clubs.forEach(club => {
    const btn = document.createElement("button");
    btn.textContent = club;

    btn.onclick = () => {
      userChoices[code] = club;
      display.innerHTML = `<strong>${club}</strong>`;
      list.classList.add("hidden");
      card.classList.add("picked");
    };

    list.appendChild(btn);
  });

  display.onclick = () => list.classList.toggle("hidden");

  return card;
}

/**********************
 * STORAGE HELPERS
 **********************/
function loadStats() {
  return JSON.parse(localStorage.getItem("gtc_stats")) || {
    gamesPlayed: 0,
    totalCorrect: 0,
    totalGuesses: 0,
    bestPercent: 0,
    streak: 0,
    lastPlayedYear: null
  };
}

function saveStats(stats) {
  localStorage.setItem("gtc_stats", JSON.stringify(stats));
}

/**********************
 * SUBMIT & RESULTS
 **********************/
function setupSubmit() {
  document.getElementById("submit").onclick = submitGame;
}

function submitGame() {
  let total = 0;
  let correct = 0;
  resultPattern = [];

  const cards = Array.from(document.querySelectorAll(".card"));
  const renderJobs = [];

  cards.forEach((card) => {
    const name = card.querySelector("h3")?.textContent;
    if (!name) return;

    const entry = Object.entries(data.competitions)
      .find(([_, c]) => c.name === name);
    if (!entry) return;

    const [code, comp] = entry;
    const season = comp.history.find(h => h.year === currentYear);
    if (!season) return;

    const winner = season.winner;
    const pick = userChoices[code];

// 🟩🟥🟨 padrão Wordle (FINAL)
if (!winner) {
  resultPattern.push("🏗️"); // 🟨
} else if (pick === winner) {
  resultPattern.push("🏆"); // 🟩
  correct++;
  total++;
} else {
  resultPattern.push("❌"); // 🟥
  total++;
}


    renderJobs.push({ card, comp, season, winner, pick });
  });

  const percent = total ? Math.round((correct / total) * 100) : 0;

  const seasonLabel = `${currentYear - 1}/${currentYear}`;

const shareText =
  `⚽ Guess The Champion – Season ${seasonLabel}\n\n` +
  resultPattern.join("") + "\n" +
  `${correct} / ${total}\n\n` +
  `Can you beat this score?\n` +
  `${location.origin}/?year=${currentYear}`;

  // stats locais
  const stats = loadStats();
  stats.gamesPlayed++;
  stats.totalCorrect += correct;
  stats.totalGuesses += total;
  if (percent > stats.bestPercent) stats.bestPercent = percent;

  if (stats.lastPlayedYear === currentYear - 1) {
    stats.streak++;
  } else {
    stats.streak = 1;
  }

  stats.lastPlayedYear = currentYear;
  saveStats(stats);

  showShare(shareText);

  const imageBtn = document.getElementById("shareImage");
imageBtn.style.display = "inline-block";

imageBtn.onclick = async () => {
  const dataUrl = generateShareImage({
    year: currentYear,
    pattern: resultPattern,
    correct,
    total
  });

  // Mobile share (best case)
  if (navigator.share) {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "guess-the-champion.png", { type: "image/png" });

    try {
      await navigator.share({
        files: [file],
        title: "Guess The Champion"
      });
      return;
    } catch {}
  }

  // Fallback: open image
  const win = window.open();
  win.document.write(`<img src="${dataUrl}" style="width:100%">`);
};

  // REVEAL SEQUENCIAL
  renderJobs.forEach((job, index) => {
    const { card, comp, season, winner, pick } = job;

    // background da competição (opcional, discreto)
    if (comp.icon) {
      const bg = document.createElement("img");
      bg.src = comp.icon;
      bg.className = "competition-bg";
      card.appendChild(bg);
    }

    card.classList.add("reveal");
    card.style.animationDelay = `${index * 500}ms`;

    setTimeout(() => {
      if (!winner) {
        card.innerHTML = `
          <div class="result-card">
            <h4>${comp.name}</h4>
            <div>🏗️ on going</div>
          </div>
        `;
        return;
      }

      if (pick === winner) card.classList.add("correct");
      else if (pick) card.classList.add("wrong");

      card.innerHTML = `
        <div class="result-card">
          <h4>${winner}</h4>
          <div class="titles">🏆 ${season.titles}</div>
          ${season.streak ? `<div class="streak">🔥 ${season.streak}</div>` : ""}
          ${pick && pick !== winner ? `<div class="wrong-pick">❌ ${pick}</div>` : ""}
        </div>
      `;

    // background da competição (opcional, discreto)
    if (comp.icon) {
      const bg = document.createElement("img");
      bg.src = comp.icon;
      bg.className = "competition-bg";
      card.appendChild(bg);
    }
    }, index * 600);
  });
}


/**********************
 * SHARE
 **********************/
function showShare(text) {
  const box = document.getElementById("shareBox");
  const btn = document.getElementById("share");

  box.value = text;
  box.style.display = "block";
  btn.style.display = "inline-block";

  btn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = " ✅";
      setTimeout(() => (btn.textContent = "Share"), 500);
    } catch {
      alert("Copy manually 👍");
    }
  };
}

function generateShareImage({ year, pattern, correct, total }) {
  const canvas = document.getElementById("shareCanvas");
  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = "#f5f7fa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // card
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;
  ctx.roundRect(40, 40, 520, 520, 24);
  ctx.fill();
  ctx.stroke();

  // title
  ctx.fillStyle = "#222";
  ctx.font = "bold 28px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("Guess The Champion", 300, 110);

  // season
  ctx.font = "18px system-ui";
  ctx.fillStyle = "#555";
  ctx.fillText(`Season ${year - 1}/${year}`, 300, 150);

  // pattern
  ctx.font = "32px system-ui";
  ctx.fillStyle = "#000";
  ctx.fillText(pattern.join(""), 300, 250);

  // score
  ctx.font = "20px system-ui";
  ctx.fillStyle = "#333";
  ctx.fillText(`${correct} / ${total}`, 300, 300);

  // footer
  ctx.font = "16px system-ui";
  ctx.fillStyle = "#777";
  ctx.fillText("guess-the-champion.pages.dev", 300, 460);

  return canvas.toDataURL("image/png");
}
