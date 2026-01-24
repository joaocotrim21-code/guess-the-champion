import competitionsData from "../data/competitions.json";

export async function onRequest(context) {
  const { COMPETITIONS } = context.env;
  const codes = Object.keys(competitionsData);
  const result = {};

  for (const code of codes) {
    const data = competitionsData[code];
    if (data) {
      // Guarda o objeto completo no KV
      await COMPETITIONS.put(code, JSON.stringify(data));
      result[code] = { status: "ok" };
    } else {
      result[code] = { error: "Não encontrado no ficheiro competitions.json" };
    }
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
}
