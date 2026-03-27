const allowCors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

async function getPayPalAccessToken(clientId, clientSecret) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || data?.error || "Could not fetch PayPal access token.");
  }

  return data.access_token;
}

export default async function handler(req, res) {
  allowCors(res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).json({ ok: false, error: "Missing PayPal credentials in server environment." });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const orderId = body.orderId || "";

  if (!orderId) {
    res.status(400).json({ ok: false, error: "Missing PayPal order ID." });
    return;
  }

  try {
    const accessToken = await getPayPalAccessToken(clientId, clientSecret);
    const response = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ ok: false, error: data?.message || "PayPal capture failed." });
      return;
    }

    const captureId = data?.purchase_units?.[0]?.payments?.captures?.[0]?.id || "";
    res.status(200).json({
      ok: true,
      status: data?.status || "",
      captureId,
      orderId: data?.id || orderId,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error?.message || "PayPal capture request failed." });
  }
}
