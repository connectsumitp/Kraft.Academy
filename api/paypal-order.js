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

  const rawText = await response.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { raw: rawText };
  }

  if (!response.ok || !data?.access_token) {
    console.error("PayPal access token request failed", {
      status: response.status,
      body: data,
    });
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
  const amount = Number(body.amount || 0);
  const currency = body.currency || "USD";
  const purpose = body.purpose || "workshop";
  const siteUrl = body.siteUrl || "";

  if (!amount || amount <= 0) {
    res.status(400).json({ ok: false, error: "Invalid amount." });
    return;
  }

  if (!siteUrl) {
    res.status(400).json({ ok: false, error: "Missing site URL." });
    return;
  }

  const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
  const returnUrl = `${normalizedSiteUrl}/?paypal_return=1&paypal_purpose=${encodeURIComponent(purpose)}`;
  const cancelUrl = `${normalizedSiteUrl}/#pricing`;

  try {
    const accessToken = await getPayPalAccessToken(clientId, clientSecret);
    const response = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
            custom_id: purpose,
          },
        ],
        application_context: {
          brand_name: "Kraft Academy",
          user_action: "PAY_NOW",
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ ok: false, error: data?.message || "PayPal order creation failed." });
      return;
    }

    const approveUrl = data?.links?.find((link) => link.rel === "approve")?.href;
    if (!approveUrl) {
      res.status(500).json({ ok: false, error: "PayPal approval link missing." });
      return;
    }

    res.status(200).json({
      ok: true,
      orderId: data.id,
      approveUrl,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error?.message || "PayPal order request failed." });
  }
}
