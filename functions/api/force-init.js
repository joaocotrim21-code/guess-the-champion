export async function onRequest(context) {
  const { COMPETITIONS } = context.env;
  const codes = ["CL","PL","PPL","PD","SA","BL1","FL1","DED","BSA","WC","EC"];
  const result = {};

  for (const code of codes) {
    await COMPETITIONS.put(code, JSON.stringify([]));
    result[code] = "Reinicializado";
  }

  return new Response(JSON.stringify(result), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
