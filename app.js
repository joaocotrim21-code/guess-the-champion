let data;
let currentYear;
let userChoices = {};


const urlParams = new URLSearchParams(window.location.search);
const yearFromUrl = urlParams.get("year");


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
  <div class="card-header">
    <img src="${comp.icon}" alt="${comp.name}" />
    <div>
      <h3>${comp.name}</h3>
      <img class="flag" src="${comp.flag}" />
    </div>
  </div>
`;


    // ordenar clubes por total de títulos (desc)
    const clubs = Object.entries(comp.totals)
      .sort((a, b) => b[1] - a[1]);

    clubs.forEach(([club, titles]) => {
      const btn = document.createElement("button");
      btn.textContent = `${club} (${titles})`;

      btn.onclick = () => {
  userChoices[code] = club;

  card.querySelectorAll("button").forEach(b =>
    b.classList.remove("selected")
  );

  btn.classList.add("selected");
};


      card.appendChild(btn);
    });

    container.appendChild(card);
  });
}

document.getElementById("submit").onclick = () => {
	let total = 0;
	let correctCount = 0;
  document.querySelectorAll(".card").forEach(card => {
    const title = card.querySelector("h3").textContent;

    const compEntry = Object.entries(data.competitions)
      .find(([_, c]) => c.name === title);

    if (!compEntry) return;

    const [code, comp] = compEntry;

    const season = comp.history.find(h => h.year === currentYear);
    const correctWinner = season?.winner;
    const userPick = userChoices[code];
	
	if (correctWinner) {
		total++;
		if (userPick === correctWinner) {
			correctCount++;
			}
}

    if (!correctWinner) {
      card.style.borderColor = "gold"; // época em curso
      return;
    }
	

card.querySelectorAll("button").forEach(b => {
  if (b.textContent.startsWith(correctWinner)) {
    b.style.border = "2px solid #2ecc71";
  }
  if (b.textContent.startsWith(userPick) && userPick !== correctWinner) {
    b.style.border = "2px solid #e74c3c";
  }
});



  });
  const percent = total ? Math.round((correctCount / total) * 100) : 0;

const shareText =
  `GuessTheChampion ${currentYear}\n` +
  `Score: ${correctCount}/${total} (${percent}%)\n\n` +
  `Play: ${window.location.origin}/?year=${currentYear}`;

showShare(shareText);

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

//guarda todos os anos possíveis
let allYears = [];

fetch("data/competitions.json")
  .then(res => res.json())
  .then(json => {
    data = json;

    const yearSet = new Set();
    Object.values(data.competitions).forEach(c =>
      c.history.forEach(h => h.year && yearSet.add(h.year))
    );

    allYears = Array.from(yearSet).sort((a, b) => b - a);
    currentYear = allYears[0];

    updateYear();
    renderCards();
  });

//lógica das setas
document.getElementById("prevYear").onclick = () => {
  const idx = allYears.indexOf(currentYear);
  if (idx < allYears.length - 1) {
    currentYear = allYears[idx + 1];
    updateYear();
    renderCards();
  }
};

document.getElementById("nextYear").onclick = () => {
  const idx = allYears.indexOf(currentYear);
  if (idx > 0) {
    currentYear = allYears[idx - 1];
    updateYear();
    renderCards();
  }
};

if (yearFromUrl && allYears.includes(Number(yearFromUrl))) {
  currentYear = Number(yearFromUrl);
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

populateYearSelect();

function updateYear() {
  document.getElementById("currentYear").textContent = currentYear;

  const select = document.getElementById("yearSelect");
  if (select) select.value = currentYear;
}

function showShare(text) {
  const btn = document.getElementById("share");
  const box = document.getElementById("shareBox");

  box.value = text;
  btn.style.display = "inline-block";
  box.style.display = "block";

  btn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copiado! ✅";
    } catch {
      alert("Copia manualmente o texto 👍");
    }
  };
}
