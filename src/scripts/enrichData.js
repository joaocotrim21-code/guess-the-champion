import fs from "fs";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_URL = "https://api.football-data.org/v4";
const TOKEN = process.env.FOOTBALL_DATA_TOKEN;

// Lista das competições suportadas
const COMPETITION_CODES = ["CL", "PL", "PD", "SA", "FL1", "PPL", "DED", "BL1", "BSA", "WC", "EC"];

async function fetchAPI(endpoint) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { "X-Auth-Token": TOKEN }
  });
  if (!res.ok) throw new Error(`Erro na chamada ${endpoint} → ${res.status} ${res.statusText}`);
  return res.json();
}

// 🔹 Enriquecer competitions.json com logos e bandeiras
async function enrichCompetitions() {
  const raw = fs.readFileSync("src/data/competitions.json");
  const data = JSON.parse(raw);

  for (const code of Object.keys(data.competitions)) {
    try {
      const comp = await fetchAPI(`/competitions/${code}`);
      data.competitions[code].icon = comp.emblem;
      data.competitions[code].flag = comp.area.flag;
      console.log(`✅ Competição ${code} enriquecida`);
    } catch (err) {
      console.error(`❌ Falhou ${code}:`, err.message);
    }
  }

  fs.writeFileSync("src/data/competitions.json", JSON.stringify(data, null, 2));
  console.log("✅ competitions.json atualizado");
}

// 🔹 Criar teams.json com emblemas dos clubes
async function enrichTeams() {
  const teamsData = {};

  for (const code of COMPETITION_CODES) {
    try {
      const data = await fetchAPI(`/competitions/${code}/teams`);
      if (data.teams) {
        for (const team of data.teams) {
          teamsData[team.name] = {
            name: team.name,
            shortName: team.shortName,
            tla: team.tla,
            crest: team.crest,
            country: team.area.name,
            competition: code
          };
        }
        console.log(`✅ Equipas de ${code} adicionadas (${data.teams.length})`);
      }
    } catch (err) {
      console.error(`❌ Falhou ${code}:`, err.message);
    }
	// wait 60 seconds before next call 
	await new Promise(r => setTimeout(r, 60000));
  }

  // Mesmo que algumas falhem, grava o que conseguiu
  fs.writeFileSync("src/data/teams.json", JSON.stringify(teamsData, null, 2));
  console.log(`✅ teams.json criado com ${Object.keys(teamsData).length} equipas`);
}

// 🔹 Executar ambos
async function enrichAll() {
  await enrichTeams();
  await enrichCompetitions();
}

enrichAll();
