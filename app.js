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
    if (!season) return;

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

    const list = card.querySelector(".club-list");
    const display = card.querySelector(".pick-display");

    const totals = Object.entries(comp.totals || {})
      .sort((a, b) => b[1] - a[1]);

    totals.forEach(([club, titles]) => {
      const btn = document.createElement("button");
      btn.textContent = `${club} (${titles})`;

      btn.onclick = () => {
        userChoices[code] = club;
        display.innerHTML = `<strong>${club}</strong>`;
        list.classList.add("hidden");
        card.classList.add("picked");
      };

      list.appendChild(btn);
    });

    display.onclick = () => {
      list.classList.toggle("hidden");
    };

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

  document.querySelectorAll(".card").forEach((card, index) => {
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

    // Época em curso
    if (!winner) {
      card.classList.add("ongoing");
      card.innerHTML = `
        <h4>${comp.name}</h4>
        <div>🏗️ Em curso</div>
      `;
      return;
    }

    total++;
    if (pick === winner) correct++;

    card.classList.add(pick === winner ? "correct" : "wrong");

    // RESULTADO FINAL DO CARD
    card.innerHTML = `
      <div class="result-card">
        <img class="club-logo" 
             src="logos/${winner}.png"
             onerror="this.style.display='none'" />
        <h4>${winner}</h4>

        ${season.streak ? `<div class="streak">🔥 ${season.streak}</div>` : ""}

        ${
          pick && pick !== winner
            ? `<div class="wrong-pick">❌ ${pick}</div>`
            : ""
        }
      </div>
    `;
  });

  const percent = total ? Math.round((correct / total) * 100) : 0;

  showShare(
    `GuessTheChampion ${currentYear}\n` +
    `Score: ${correct}/${total} (${percent}%)\n\n` +
    `${location.origin}/?year=${currentYear}`
  );
    card.classList.add("reveal");
  }, index * 120);
});

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

}

