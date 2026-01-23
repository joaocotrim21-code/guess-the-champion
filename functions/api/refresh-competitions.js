export async function onRequest(context) {
  const { COMPETITIONS, FOOTBALL_DATA_TOKEN } = context.env;
  const codes = ["CL", "PL", "PPL", "PD", "SA", "BL1", "FL1", "DED", "BSA", "WC", "EC"];
  const result = {};

  for (const code of codes) {
    await new Promise(r => setTimeout(r, 500)); // Delay para evitar 429
    try {
      const res = await fetch(`https://api.football-data.org/v4/competitions/${code}`, {
        headers: { "X-Auth-Token": FOOTBALL_DATA_TOKEN }
      });

      if (!res.ok) {
        result[code] = { error: `Erro ${res.status}` };
        continue;
      }

      const data = await res.json();

      // Guarda apenas o histórico no KV
      if (data.seasons) {
        const history = data.seasons.map(season => ({
          season: season.startDate + "/" + season.endDate,
          year: new Date(season.endDate).getFullYear(),
          winner: season.winner?.name || null,
          titles: season.winner?.titles || null,
          streak: season.winner?.streak || null
        }));
        await COMPETITIONS.put(code, JSON.stringify(history));
        result[code] = { updated: true };
      } else {
        result[code] = { error: "Sem seasons no payload" };
      }
    } catch (err) {
      result[code] = { error: "Erro ao buscar dados" };
    }
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
}
