import competitionsData from "../data/competitions.json";

export async function onRequest(context) {
  const { COMPETITIONS } = context.env;
  const codes = Object.keys(competitionsData);
  const result = {};

  for (const code of codes) {
    const fullObject = competitionsData[code];
    if (fullObject && typeof fullObject === "object") {
      await COMPETITIONS.put(code, JSON.stringify(fullObject));
      result[code] = { status: "ok" };
    } else {
      result[code] = { error: "Formato inválido no ficheiro" };
    }
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
}
