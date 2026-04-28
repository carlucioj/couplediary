// Edge function: extrai metadados (title, image, price, brand) de uma URL
// Usado pela Lista de Desejos para enriquecer um link colado pelo usuário.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function pickMeta(html: string, names: string[]): string | null {
  for (const name of names) {
    // <meta property="og:title" content="...">  ou name="..."
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`,
      "i",
    );
    const m = html.match(re);
    if (m?.[1]) return decodeEntities(m[1].trim());
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`,
      "i",
    );
    const m2 = html.match(re2);
    if (m2?.[1]) return decodeEntities(m2[1].trim());
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractTitle(html: string): string | null {
  const og = pickMeta(html, ["og:title", "twitter:title"]);
  if (og) return og;
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m?.[1]?.trim() ?? null;
}

function extractDescription(html: string): string | null {
  return pickMeta(html, ["og:description", "twitter:description", "description"]);
}

function extractImage(html: string, base: URL): string | null {
  const v = pickMeta(html, ["og:image", "twitter:image", "og:image:url"]);
  if (!v) return null;
  try {
    return new URL(v, base).toString();
  } catch {
    return v;
  }
}

function extractPrice(html: string): { price: number; currency: string } | null {
  const amount = pickMeta(html, [
    "product:price:amount",
    "og:price:amount",
    "twitter:data1",
  ]);
  const currency = pickMeta(html, ["product:price:currency", "og:price:currency"]) || "BRL";
  if (amount) {
    const n = parseFloat(amount.replace(",", "."));
    if (!Number.isNaN(n)) return { price: n, currency };
  }
  // tentativa via JSON-LD
  const ldMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (ldMatch) {
    try {
      const data = JSON.parse(ldMatch[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const offers = item?.offers;
        const offer = Array.isArray(offers) ? offers[0] : offers;
        if (offer?.price) {
          const n = parseFloat(String(offer.price).replace(",", "."));
          if (!Number.isNaN(n)) {
            return { price: n, currency: offer.priceCurrency || currency };
          }
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

function extractBrand(html: string, hostname: string): string | null {
  const og = pickMeta(html, ["product:brand", "og:site_name"]);
  if (og) return og;
  return hostname.replace(/^www\./, "").split(".")[0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: "invalid url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return new Response(JSON.stringify({ error: "invalid protocol" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NossoDiarioBot/1.0; +https://nossodiario.app)",
        Accept: "text/html,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `fetch failed (${res.status})` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = (await res.text()).slice(0, 500_000); // 500KB cap

    const title = extractTitle(html) ?? parsed.hostname;
    const description = extractDescription(html);
    const image = extractImage(html, parsed);
    const priceInfo = extractPrice(html);
    const brand = extractBrand(html, parsed.hostname);

    return new Response(
      JSON.stringify({
        title,
        description,
        image_url: image,
        price: priceInfo?.price ?? null,
        currency: priceInfo?.currency ?? "BRL",
        brand,
        url: parsed.toString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unexpected";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
