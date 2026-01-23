import competitions from "../data/competitions.json";

export async function onRequest(context) {
  const { COMPETITIONS } = context.env;
  const FOOTBALL_DATA_TOKEN = await context.env.FOOTBALL_DATA_TOKEN;
  const result = {};

  for (const code of Object.keys(competitions)) {
    await COMPETITIONS.put(code, JSON.stringify(competitions[code]));
    result[code] = "Importado";
  }

  return new Response(JSON.stringify(result), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
