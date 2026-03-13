const allowCors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

module.exports = async function handler(req, res) {
  allowCors(res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    res.status(500).json({ ok: false, error: "Missing Razorpay keys in server environment." });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  if (body.action !== "create_order") {
    res.status(400).json({ ok: false, error: "Unknown action" });
    return;
  }

  const payload = {
    amount: Number(body.amount || 0),
    currency: body.currency || "INR",
    receipt: body.receipt || `ka_${Date.now()}`,
    payment_capture: 1,
    notes: body.notes || {},
  };

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ ok: false, error: data?.error?.description || "Order failed" });
      return;
    }

    res.status(200).json({
      ok: true,
      order_id: data.id,
      amount: data.amount,
      currency: data.currency,
      key: keyId,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error?.message || "Order request failed" });
  }
};
