export function GET() {
  return new Response(
    JSON.stringify({
      tokenExists: !!import.meta.env.APIFY_API_TOKEN,
      tokenLength: import.meta.env.APIFY_API_TOKEN?.length || 0
    }),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
