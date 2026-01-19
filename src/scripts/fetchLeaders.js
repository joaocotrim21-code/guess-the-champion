// Competições normais → atualizam na primeira chamada do minuto
const COMPETITION_CODES = ["CL", "PL", "PD", "SA", "FL1", "PPL", "DED", "BL1", "BSA"];
// Competições especiais (Mundial e Europeu) → só atualizam na primeira chamada da hora
const SPECIAL_CODES = ["WC", "EC"];

// ----------------------
// Helpers de sessão local
// ----------------------
export function saveSession(state) {
  localStorage.setItem("guessChampionSession", JSON.stringify(state));
}

export function loadSession() {
  const data = localStorage.getItem("guessChampionSession");
  return data ? JSON.parse(data) : null;
}

export function clearSession() {
  localStorage.removeItem("guessChampionSession");
}

// ----------------------
// Helpers de tempo
// ----------------------
function shouldUpdateMinute() {
  const lastUpdate = localStorage.getItem("leadersLastUpdateMinute");
  const now = new Date();
  if (!lastUpdate) return true;
  const last = new Date(lastUpdate);

  const sameMinute =
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate() &&
    last.getHours() === now.getHours() &&
    last.getMinutes() === now.getMinutes();

  return !sameMinute;
}

function shouldUpdateHour() {
  const lastUpdate = localStorage.getItem("leadersLastUpdateHour");
  const now = new Date();
  if (!lastUpdate) return true;
  const last = new Date(lastUpdate);

  const sameHour =
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate() &&
    last.getHours() === now.getHours();

  return !sameHour;
}

// ----------------------
// Funções de API (via Worker)
// ----------------------
async function fetchLeader(code) {
  const res = await fetch(`https://guess-the-champion.joaocotrim21.workers.dev/current-leaders`);
  if (!res.ok) throw new Error(`Erro em leaders: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data[code] || null;
}

async function fetchCompetitionData() {
  const res = await fetch("https://guess-the-champion.joaocotrim21.workers.dev/update-competitions");
  if (!res.ok) throw new Error(`Erro em competitions: ${res.status} ${res.statusText}`);
  return res.json();
}

// ----------------------
// Atualização principal
// ----------------------
export async function updateLeadersAndWinnersIfNeeded() {
  const leaders = JSON.parse(localStorage.getItem("leadersData") || "{}");

  // Atualiza líderes normais (primeira do minuto)
  if (shouldUpdateMinute()) {
    const competitions = await fetchCompetitionData();

    for (const code of COMPETITION_CODES) {
      try {
        const leader = await fetchLeader(code);
        if (leader) leaders[code] = leader;
        console.log(`✅ Líder de ${code}: ${leader?.team}`);
      } catch (err) {
        console.error(`❌ Falhou líder ${code}:`, err.message);
      }
    }

    localStorage.setItem("leadersLastUpdateMinute", new Date().toISOString());
    localStorage.setItem("leadersData", JSON.stringify(leaders));
  }

  // Atualiza WC e EC (primeira da hora)
  if (shouldUpdateHour()) {
    const competitions = await fetchCompetitionData();

    for (const code of SPECIAL_CODES) {
      try {
        const leader = await fetchLeader(code);
        if (leader) leaders[code] = leader;
        console.log(`✅ Líder especial de ${code}: ${leader?.team}`);
      } catch (err) {
        console.error(`❌ Falhou líder ${code}:`, err.message);
      }
    }

    localStorage.setItem("leadersLastUpdateHour", new Date().toISOString());
    localStorage.setItem("leadersData", JSON.stringify(leaders));
  }
}
