export async function onRequest(context) {
  const { COMPETITIONS } = context.env;
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response(JSON.stringify({ error: "Falta parâmetro ?code=" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const raw = await COMPETITIONS.get(code);
  if (!raw) {
    return new Response(JSON.stringify({ error: `Não existe chave ${code} no KV` }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const parsed = JSON.parse(raw);
    return new Response(JSON.stringify(parsed, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Valor não é JSON válido", raw }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
