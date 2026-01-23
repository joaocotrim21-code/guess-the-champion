import competitionsData from "../data/competitions.json";

export async function onRequest(context) {
  const { COMPETITIONS } = context.env;
  const result = {};

  const competitions = competitionsData.competitions;

  for (const code of Object.keys(competitions)) {
    const history = competitions[code].history || [];
    await COMPETITIONS.put(code, JSON.stringify(history));
    result[code] = "Importado";
  }

  return new Response(JSON.stringify(result), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
