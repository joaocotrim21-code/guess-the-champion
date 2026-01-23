export async function onRequest(context) {
  const { COMPETITIONS } = context.env;
  const codes = ["CL", "PL", "PPL", "PD", "SA", "BL1", "FL1", "DED", "BSA", "WC", "EC"];
  const result = {};

  for (const code of codes) {
    const leader = await COMPETITIONS.get(`${code}_LEADER`, { type: "json" });
    if (leader) {
      result[code] = leader;
    } else {
      result[code] = { error: "Sem dados de líder no KV" };
    }
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
}
