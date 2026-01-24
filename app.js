let data;
let currentYear;
let userChoices = {};

fetch("data/competitions.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    currentYear = getLatestYear();
    updateYear();
    renderCards();
  });

function getLatestYear() {
  const years = [];

  Object.values(data.competitions).forEach(comp => {
    comp.history.forEach(h => {
      if (h.year) years.push(h.year);
    });
  });

  return Math.max(...years);
}

function updateYear() {
  document.getElementById("currentYear").textContent = currentYear;
}

function renderCards() {
  const container = document.getElementById("cards");
  container.innerHTML = "";
  userChoices = {};

  Object.entries(data.competitions).forEach(([code, comp]) => {
    const card = document.createElement("div");
    card.className = "card";

    // título do cartão
    card.innerHTML = `
      <h3>${comp.name}</h3>
      <small>${comp.country}</small>
    `;

    // ordenar clubes por total de títulos (desc)
    const clubs = Object.entries(comp.totals)
      .sort((a, b) => b[1] - a[1]);

    clubs.forEach(([club, titles]) => {
      const btn = document.createElement("button");
      btn.textContent = `${club} (${titles})`;

      btn.onclick = () => {
        userChoices[code] = club;

        // feedback visual simples
        card.querySelectorAll("button").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
      };

      card.appendChild(btn);
    });

    container.appendChild(card);
  });
}

document.getElementById("submit").onclick = () => {
  document.querySelectorAll(".card").forEach(card => {
    const title = card.querySelector("h3").textContent;

    const compEntry = Object.entries(data.competitions)
      .find(([_, c]) => c.name === title);

    if (!compEntry) return;

    const [code, comp] = compEntry;

    const season = comp.history.find(h => h.year === currentYear);
    const correctWinner = season?.winner;
    const userPick = userChoices[code];

    if (!correctWinner) {
      card.style.borderColor = "gold"; // época em curso
      return;
    }

    if (userPick === correctWinner) {
      card.classList.add("correct");
    } else {
      card.classList.add("wrong");
    }
  });
};

// botão random 🎲
document.getElementById("randomYear").onclick = () => {
  const years = [];

  Object.values(data.competitions).forEach(c =>
    c.history.forEach(h => h.year && years.push(h.year))
  );

  currentYear = years[Math.floor(Math.random() * years.length)];
  updateYear();
  renderCards();
};
