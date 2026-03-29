const allowCors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

export default async function handler(req, res) {
  allowCors(res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const scriptUrl = process.env.VITE_AVAILABILITY_SCRIPT_URL;
  if (!scriptUrl) {
    res.status(500).json({ ok: false, error: "Missing VITE_AVAILABILITY_SCRIPT_URL in server environment." });
    return;
  }

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_availability" }),
    });

    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { ok: false, error: text || "Availability response was not JSON." };
    }

    if (!response.ok || !data?.ok) {
      res.status(response.ok ? 500 : response.status).json({ ok: false, error: data?.error || "Availability fetch failed." });
      return;
    }

    res.status(200).json({ ok: true, items: Array.isArray(data.items) ? data.items : [] });
  } catch (error) {
    res.status(500).json({ ok: false, error: error?.message || "Availability request failed." });
  }
}
