import competitionsData from "./data/competitions.json";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const now = new Date();

    const jsonHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    };

    // Auto-inicialização do KV
    const initFlag = await env.COMPETITIONS.get("INIT_DONE");
    if (!initFlag) {
      for (const [code, comp] of Object.entries(competitionsData.competitions)) {
        const payload = { history: comp.history, totals: comp.totals };
        await env.COMPETITIONS.put(code, JSON.stringify(payload));
      }
      await env.COMPETITIONS.put("INIT_DONE", "true");
    }

    // Exportar todo o KV
    if (url.pathname === "/export-competitions") {
      const exportData = {};
      for (const [code] of Object.entries(competitionsData.competitions)) {
        exportData[code] = await env.COMPETITIONS.get(code, { type: "json" });
      }
      return new Response(JSON.stringify(exportData, null, 2), { headers: jsonHeaders });
    }

    // Update competitions (incremental)
    if (url.pathname === "/update-competitions") {
      const codes = Object.keys(competitionsData.competitions);
      const updated = {};

      const minute = now.getMinutes();
      const groupA = codes.slice(0, Math.ceil(codes.length / 2));
      const groupB = codes.slice(Math.ceil(codes.length / 2));
      const activeGroup = (minute % 2 === 0) ? groupA : groupB;

      for (const code of codes) {
        if (activeGroup.includes(code)) {
          try {
            const res = await fetch(`https://api.football-data.org/v4/competitions/${code}`, {
              headers: { "X-Auth-Token": env.FOOTBALL_DATA_TOKEN }
            });
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const comp = await res.json();

            const seasonId = comp.currentSeason?.startDate?.slice(0, 4) + "/" + comp.currentSeason?.endDate?.slice(2, 4);
            const seasonYear = parseInt(comp.currentSeason?.endDate?.slice(0, 4));

            const stored = await env.COMPETITIONS.get(code, { type: "json" }) || { history: [], totals: {} };
            const history = stored.history;
            let existing = history.find(h => h.season === seasonId);

            if (!existing) {
              history.push({ season: seasonId, year: seasonYear, winner: null, titles: null });
              existing = history.find(h => h.season === seasonId);
            }

            if (comp.season?.winner && existing && !existing.winner) {
              const winnerName = comp.season.winner.name;
              const winnerCrest = comp.season.winner.crest;

              const titlesCount = history.filter(h => {
                const w = typeof h.winner === "string" ? h.winner : h.winner?.name;
                return w === winnerName;
              }).length + 1;

              existing.winner = { name: winnerName, crest: winnerCrest };
              existing.titles = titlesCount;
            }

            const totals = {};
            for (const h of history) {
              if (h.winner) {
                const name = typeof h.winner === "string" ? h.winner : h.winner.name;
                totals[name] = (totals[name] || 0) + 1;
              }
            }

            const final = { history, totals };
            updated[code] = final;

            await env.COMPETITIONS.put(code, JSON.stringify(final));
          } catch (err) {
            updated[code] = { error: err.message };
          }
        } else {
          updated[code] = await env.COMPETITIONS.get(code, { type: "json" }) || { cached: true };
        }
      }

      return new Response(JSON.stringify(updated, null, 2), { headers: jsonHeaders });
    }

    // Current leaders corrigido
    if (url.pathname === "/current-leaders") {
      const codes = Object.keys(competitionsData.competitions);
      const leaders = {};
      const minute = now.getMinutes();
      const groupA = codes.slice(0, Math.ceil(codes.length / 2));
      const groupB = codes.slice(Math.ceil(codes.length / 2));
      const activeGroup = (minute % 2 === 0) ? groupA : groupB;

      for (const code of codes) {
        if (activeGroup.includes(code)) {
          try {
            const metaRes = await fetch(`https://api.football-data.org/v4/competitions/${code}`, {
              headers: { "X-Auth-Token": env.FOOTBALL_DATA_TOKEN }
            });
            const meta = await metaRes.json();
            const startDate = new Date(meta.currentSeason?.startDate);

            if (startDate > now) {
              leaders[code] = { skipped: "Competição ainda não começou" };
              continue;
            }

            const res = await fetch(`https://api.football-data.org/v4/competitions/${code}/standings`, {
              headers: { "X-Auth-Token": env.FOOTBALL_DATA_TOKEN }
            });
            const standings = await res.json();
            const table = standings.standings?.[0]?.table;

            if (table && table.length > 0) {
              const leader = table[0].team;
              const points = table[0].points;
              leaders[code] = { team: leader.name, crest: leader.crest, points };
              await env.COMPETITIONS.put(`leader_${code}`, JSON.stringify(leaders[code]));
            }
          } catch (err) {
            leaders[code] = { error: err.message };
          }
        } else {
          leaders[code] = await env.COMPETITIONS.get(`leader_${code}`, { type: "json" }) || { cached: true };
        }
      }

      return new Response(JSON.stringify(leaders, null, 2), { headers: jsonHeaders });
    }

    return new Response("Worker ativo. Endpoints: /update-competitions, /current-leaders, /export-competitions", {
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
};
