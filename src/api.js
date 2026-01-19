const API_URL = "https://api.football-data.org/v4";
const TOKEN = "e3cf43d89e674df983d4d2c4664a6a3c"; // substitui pelo teu token gratuito

async function fetchAPI(endpoint) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { "X-Auth-Token": TOKEN }
  });
  if (!res.ok) throw new Error("Erro na chamada API");
  return res.json();
}

// Logos e bandeiras (cache em deploy)
export async function getCompetition(code) {
  return fetchAPI(`/competitions/${code}`);
}
export async function getTeams(code) {
  return fetchAPI(`/competitions/${code}/teams`);
}

// Standings (líder atual, cache diário)
export async function getStandings(code) {
  return fetchAPI(`/competitions/${code}/standings`);
}
