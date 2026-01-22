import dotenv from "dotenv";
dotenv.config();

const API_URL = "https://api.football-data.org/v4";

function getToken() {
  if (typeof window !== "undefined") {
    throw new Error("Do not call football-data API from the browser. Use the Worker proxy endpoints instead.");
  }
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) throw new Error("FOOTBALL_DATA_TOKEN not set in environment");
  return token;
}

async function fetchAPI(endpoint) {
  const TOKEN = getToken();
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { "X-Auth-Token": TOKEN }
  });
  if (!res.ok) throw new Error(`Erro na chamada API ${res.status} ${res.statusText}`);
  return res.json();
}

export async function getCompetition(code) {
  return fetchAPI(`/competitions/${code}`);
}
export async function getTeams(code) {
  return fetchAPI(`/competitions/${code}/teams`);
}
export async function getStandings(code) {
  return fetchAPI(`/competitions/${code}/standings`);
}