export async function onRequest(context) {
  const { COMPETITIONS, FOOTBALL_DATA_TOKEN } = context.env;
  const cacheKey = "competitions-data";
  const cached = await COMPETITIONS.get(cacheKey, { type: "json" });

  // Se já houver dados guardados, devolve diretamente
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { "Content-Type": "application/json" }
    });
  }

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
      result[code] = data;
    } catch (err) {
      result[code] = { error: "Erro ao buscar dados" };
    }
  }

  // Guarda os dados em cache por 1 hora
  await COMPETITIONS.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
}
