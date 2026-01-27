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
    });
}

function buildAllYears() {
  allYears = [
    ...new Set(
      Object.values(data.competitions)
        .flatMap(c =>
          c.history
            .filter(h => h.winner !== undefined)
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
    </div>

    <div class="pick-display">
      <span class="placeholder">Escolhe o campeão</span>
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
 * SUBMIT & RESULTS
 **********************/
function setupSubmit() {
  document.getElementById("submit").onclick = submitGame;
}

function submitGame() {
  let total = 0;
  let correct = 0;
  resultPattern = [];

  const cards = document.querySelectorAll(".card");

  cards.forEach((card, index) => {
    setTimeout(() => {
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

      // 🟩🟥🟨 pattern
      if (!winner) resultPattern.push("🟨");
      else if (pick === winner) resultPattern.push("🟩");
      else resultPattern.push("🟥");

      if (!winner) {
        card.innerHTML = `<h4>${comp.name}</h4><div>🏗️ Em curso</div>`;
        return;
      }

      total++;
      if (pick === winner) correct++;

      card.classList.add(pick === winner ? "correct" : "wrong");

      card.innerHTML = `
        <div class="result-card">
          <img class="club-logo"
               src="logos/${winner}.png"
               onerror="this.style.display='none'" />
          <h4>${winner}</h4>
          <div class="titles">🏆 ${season.titles}º título</div>
          ${season.streak ? `<div class="streak">🔥 ${season.streak}</div>` : ""}
          ${pick && pick !== winner ? `<div class="wrong-pick">❌ ${pick}</div>` : ""}
        </div>
      `;
    }, index * 120);
  });

  const percent = total ? Math.round((correct / total) * 100) : 0;

  const shareText =
    `GuessTheChampion ${currentYear}\n` +
    resultPattern.join("") + "\n" +
    `${correct}/${total} (${percent}%)\n\n` +
    `${location.origin}/?year=${currentYear}`;

  // 📊 atualizar stats locais
const stats = loadStats();

stats.gamesPlayed++;
stats.totalCorrect += correct;
stats.totalGuesses += total;

const percent = total ? Math.round((correct / total) * 100) : 0;
if (percent > stats.bestPercent) stats.bestPercent = percent;

// streak por ano
if (stats.lastPlayedYear === currentYear - 1) {
  stats.streak++;
} else {
  stats.streak = 1;
}

stats.lastPlayedYear = currentYear;

saveStats(stats);

  showShare(shareText);
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
      btn.textContent = "Copiado ✅";
      setTimeout(() => (btn.textContent = "Share"), 2000);
    } catch {
      alert("Copia manualmente 👍");
    }
  };

  //helpers de storage
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

}
