export async function onRequest(context) {
  const res = await fetch("https://guess-the-champion.joaocotrim21.workers.dev/update-competitions");
  const data = await res.text();
  return new Response(data, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
