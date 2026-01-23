export async function onRequest(context) {
  const { COMPETITIONS } = context.env;
  const FOOTBALL_DATA_TOKEN = await context.env.FOOTBALL_DATA_TOKEN;
  const keys = await COMPETITIONS.list();
  const result = {};

  for (const { name } of keys.keys) {
    const raw = await COMPETITIONS.get(name);
    if (raw) result[name] = JSON.parse(raw);
  }

  return new Response(JSON.stringify(result), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
