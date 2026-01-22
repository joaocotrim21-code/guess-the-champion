export async function onRequest(context) {
  const { COMPETITIONS } = context.env;
  const keys = await COMPETITIONS.list();
  const result = {};

  for (const { name } of keys.keys) {
    if (name.startsWith("leader_")) {
      const raw = await COMPETITIONS.get(name);
      if (raw) result[name.slice(7)] = JSON.parse(raw);
    }
  }

  return new Response(JSON.stringify(result), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
