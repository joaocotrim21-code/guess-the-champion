let data;
let currentYear;
let allYears = [];
let userChoices = {};

const urlParams = new URLSearchParams(window.location.search);
const yearFromUrl = Number(urlParams.get("year"));

// FETCH ÚNICO ✅
fetch("data/competitions.json")
  .then(res => res.json())
  .then(json => {
    data = json;

    // calcular todos os anos possíveis
   allYears = [...new Set(
  Object.values(data.competitions)
    .flatMap(c =>
      c.history
        .filter(h => h.winner) // só épocas concluídas
        .map(h => h.year)
    )
)].sort((a, b) => b - a);


    // definir ano inicial
    currentYear = allYears.includes(yearFromUrl)
      ? yearFromUrl
      : allYears[0];

    updateYear();
    populateYearSelect();
    renderCards();
  });

function updateYear() {
  document.getElementById("currentYear").textContent = currentYear;
  const select = document.getElementById("yearSelect");
  if (select) select.value = currentYear;
}

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
    updateYear();
    renderCards();
  };
}

function renderCards() {
  const container = document.getElementById("cards");
  container.innerHTML = "";
  userChoices = {};

  Object.entries(data.competitions).forEach(([code, comp]) => {
  const season = comp.history.find(h => h.year === currentYear);
  if (!season) return; //não existia nesse ano
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-header">
        <img class="icon" src="${comp.icon}" />
        <h3>${comp.name}</h3>
      </div>
    `;

    const totals = Object.entries(comp.totals || {})
      .sort((a, b) => b[1] - a[1]);

    totals.forEach(([club, titles]) => {
      const btn = document.createElement("button");
      btn.textContent = `${club} (${titles})`;

      btn.onclick = () => {
        userChoices[code] = club;
        card.querySelectorAll("button").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
      };

      card.appendChild(btn);
    });

    container.appendChild(card);
  });
}

// SETAS
document.getElementById("prevYear").onclick = () => {
  const i = allYears.indexOf(currentYear);
  if (i < allYears.length - 1) {
    currentYear = allYears[i + 1];
    updateYear();
    renderCards();
  }
};

document.getElementById("nextYear").onclick = () => {
  const i = allYears.indexOf(currentYear);
  if (i > 0) {
    currentYear = allYears[i - 1];
    updateYear();
    renderCards();
  }
};

// RANDOM 🎲
document.getElementById("randomYear").onclick = () => {
  currentYear = allYears[Math.floor(Math.random() * allYears.length)];
  updateYear();
  renderCards();
};

// SUBMIT
document.getElementById("submit").onclick = () => {
  let total = 0;
  let correct = 0;

  document.querySelectorAll(".card").forEach(card => {
    const name = card.querySelector("h3").textContent;
    const entry = Object.entries(data.competitions)
      .find(([_, c]) => c.name === name);

    if (!entry) return;

    const [code, comp] = entry;
    const season = comp.history.find(h => h.year === currentYear);
    const winner = season?.winner;
    const pick = userChoices[code];
    
    card.innerHTML = `
  <div class="result-card ${pick === winner ? "correct" : "wrong"}">
    <img class="club-logo" src="logos/${winner}.png" />
    <h4>${winner}</h4>
    ${season.streak ? `<div class="streak">🔥 ${season.streak}</div>` : ""}
    ${
      pick && pick !== winner
        ? `<div class="wrong-pick">❌ ${pick}</div>`
        : ""
    }
  </div>
`;

    if (!winner) {
      card.style.borderColor = "gold";
      return;
    }

    total++;
    if (pick === winner) correct++;

    card.querySelectorAll("button").forEach(b => {
      if (b.textContent.startsWith(winner)) b.style.border = "2px solid green";
      if (b.textContent.startsWith(pick) && pick !== winner)
        b.style.border = "2px solid red";
    });
  });

  const percent = total ? Math.round((correct / total) * 100) : 0;

  showShare(
    `GuessTheChampion ${currentYear}\n` +
    `Score: ${correct}/${total} (${percent}%)\n\n` +
    `${location.origin}/?year=${currentYear}`
  );
};

function showShare(text) {
  const box = document.getElementById("shareBox");
  const btn = document.getElementById("share");

  box.value = text;
  box.style.display = "block";
  btn.style.display = "inline-block";

  btn.onclick = async () => {
    await navigator.clipboard.writeText(text);
    btn.textContent = "Copiado! ✅";
  };
}

