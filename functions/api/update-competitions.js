export async function onRequest(context) {
  const { COMPETITIONS } = context.env;
  const codes = ["CL", "PL", "PPL", "PD", "SA", "BL1", "FL1", "DED", "BSA", "WC", "EC"];
  const competitions = {};

  for (const code of codes) {
    const data = await COMPETITIONS.get(code, { type: "json" });
    if (data) {
      // devolve o objeto completo (já inclui history, totals, name, icon, flag)
      competitions[code] = data;
    } else {
      competitions[code] = { error: "Sem dados no KV" };
    }
  }

  return new Response(JSON.stringify({ competitions }), {
    headers: { "Content-Type": "application/json" }
  });
}
