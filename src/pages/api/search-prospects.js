export async function POST({ request }) {
  try {
    const body = await request.json();

    const keyword = String(body.keyword || "").trim();
    const location = String(body.location || "").trim();
    const limit = Number(body.limit || 20);

    if (!keyword) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Keyword wajib diisi."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    /*
     * Astro membaca variable dari .env melalui import.meta.env
     */
    const token = import.meta.env.APIFY_API_TOKEN;

    if (!token) {
      console.error(
        "APIFY_API_TOKEN tidak ditemukan."
      );

      return new Response(
        JSON.stringify({
          success: false,
          message: "APIFY_API_TOKEN belum diatur."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const input = {
      searchStringsArray: [keyword],
      locationQuery: location,
      maxCrawledPlacesPerSearch: Math.min(limit, 100),
      language: "id",
      maximumLeadsEnrichmentRecords: 0
    };

    console.log(
      "APIFY TOKEN TERBACA:",
      token.length,
      "karakter"
    );

    console.log(
      "SEARCH:",
      keyword,
      "| LOCATION:",
      location
    );

    const response = await fetch(
      "https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify(input)
      }
    );

    const rawResponse =
      await response.text();

    let data = [];

    try {
      data = rawResponse
        ? JSON.parse(rawResponse)
        : [];
    } catch {
      console.error(
        "Response Apify bukan JSON:",
        rawResponse.slice(0, 1000)
      );

      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Response dari Apify bukan JSON valid.",
          rawResponse:
            rawResponse.slice(0, 1000)
        }),
        {
          status: 502,
          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );
    }

    if (!response.ok) {

      console.error(
        "APIFY ERROR:",
        response.status,
        data
      );

      return new Response(
        JSON.stringify({
          success: false,
          message:
            data?.error?.message ||
            data?.message ||
            "Apify gagal menjalankan pencarian.",

          details: data
        }),
        {
          status: response.status,
          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );
    }

    console.log(
      "APIFY BERHASIL:",
      Array.isArray(data)
        ? data.length
        : 0,
      "hasil"
    );

    return new Response(
      JSON.stringify({
        success: true,

        results:
          Array.isArray(data)
            ? data
            : []
      }),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );

  } catch (error) {

    console.error(
      "SEARCH PROSPECT ERROR:",
      error
    );

    return new Response(
      JSON.stringify({
        success: false,

        message:
          error?.message ||
          "Terjadi kesalahan."
      }),
      {
        status: 500,

        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );
  }
}