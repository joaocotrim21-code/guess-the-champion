export async function onRequest(context) {
  const { COMPETITIONS, FOOTBALL_DATA_TOKEN } = context.env;
  const codes = ["CL","PL","PPL","PD","SA","BL1","FL1","DED","BSA","WC","EC"];
  const result = {};

  for (const code of codes) {
    try {
      const res = await fetch(`https://api.football-data.org/v4/competitions/${code}`, {
        headers: { "X-Auth-Token": FOOTBALL_DATA_TOKEN }
      });

      if (!res.ok) {
        result[code] = { error: `Erro ${res.status}` };
        continue;
      }

      const data = await res.json();
      const history = await COMPETITIONS.get(code);
      const parsed = history ? JSON.parse(history) : [];

      parsed.unshift({
        season: data.currentSeason?.startDate?.slice(0,4) + "/" + data.currentSeason?.endDate?.slice(0,4),
        year: parseInt(data.currentSeason?.endDate?.slice(0,4)),
        winner: data.winner?.name || null,
        titles: data.winner?.titles || null,
        streak: data.winner?.streak || null
      });

      await COMPETITIONS.put(code, JSON.stringify(parsed));
      result[code] = { history: parsed };

    } catch (err) {
      result[code] = { error: "Erro 400" };
    }
  }

  return new Response(JSON.stringify(result), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
