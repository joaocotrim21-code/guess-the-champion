export async function onRequest(context) {
  const { COMPETITIONS } = context.env;
  const codes = ["CL", "PL", "PPL", "PD", "SA", "BL1", "FL1", "DED", "BSA", "WC", "EC"];
  const result = {};

  for (const code of codes) {
    const history = await COMPETITIONS.get(code, { type: "json" });
    if (Array.isArray(history)) {
      result[code] = {
        name: null, // opcional: podes guardar o nome no KV se quiseres
        history
      };
    } else {
      result[code] = { error: "Sem dados no KV" };
    }
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
}
