import competitionsData from "../data/competitions.json";

export async function onRequest(context) {
  const { COMPETITIONS } = context.env;
  const result = {};

  // Itera por cada código de competição (CL, PL, etc.)
  for (const code in competitionsData) {
    const fullObject = competitionsData[code];
    if (fullObject && typeof fullObject === "object") {
      // Escreve no KV o objeto completo (history + totals + outros campos)
      await COMPETITIONS.put(code, JSON.stringify(fullObject));
      result[code] = { status: "CERTO" };
    } else {
      result[code] = { error: "Formato inválido no ficheiro" };
    }
  }

  // Devolve diretamente o resultado, sem embrulhar em "competitions"
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
}
