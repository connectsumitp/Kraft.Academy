// Razorpay Orders + Confirmation Email via Google Apps Script
// Deploy as Web App (execute as: Me, access: Anyone)
// Set Script Properties:
// RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

function doPost(e) {
  try {
    var body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = body.action || "create_order";

    if (action === "send_confirmation") {
      return sendConfirmationEmail_(body);
    }

    return createOrder_(body);
  } catch (err) {
    return jsonOut({ ok: false, error: err && err.message ? err.message : "Unknown error." }, 500);
  }
}

function createOrder_(body) {
  var props = PropertiesService.getScriptProperties();
  var keyId = props.getProperty('RAZORPAY_KEY_ID');
  var keySecret = props.getProperty('RAZORPAY_KEY_SECRET');

  if (!keyId || !keySecret) {
    return jsonOut({ ok: false, error: 'Missing Razorpay API keys in Script Properties.' }, 400);
  }

  var currency = body.currency || 'INR';
  var amount = Number(body.amount || 0);
  var receipt = body.receipt || ('ka_' + new Date().getTime());

  if (!amount || amount <= 0) {
    return jsonOut({ ok: false, error: 'Invalid amount.' }, 400);
  }

  var orderPayload = {
    amount: Math.round(amount),
    currency: currency,
    receipt: receipt,
    notes: body.notes || {}
  };

  var url = 'https://api.razorpay.com/v1/orders';
  var auth = Utilities.base64Encode(keyId + ':' + keySecret);
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(orderPayload),
    headers: {
      Authorization: 'Basic ' + auth
    },
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var data = JSON.parse(response.getContentText() || '{}');

  if (code >= 200 && code < 300 && data && data.id) {
    return jsonOut({ ok: true, key: keyId, order_id: data.id, amount: data.amount, currency: data.currency }, 200);
  }

  return jsonOut({ ok: false, error: data && data.error ? data.error.description : 'Order creation failed.' }, code || 500);
}

function sendConfirmationEmail_(body) {
  var to = (body && body.email) ? String(body.email).trim() : '';
  if (!to) {
    return jsonOut({ ok: false, error: 'Missing email.' }, 400);
  }

  var name = body.name || "Student";
  var purpose = body.purpose || "workshop";
  var timing = body.timing || "";
  var country = body.country || "";
  var contact = body.contact || "";
  var age = body.age || "";
  var program = body.program || "";

  var subject = "Kraft Academy | Seat Reserved";
  var lines = [];
  lines.push("Thank you! Your seat has been reserved.");
  lines.push("Your email will receive the date, time, and link for the session soon. Please add that to your calendar.");
  lines.push("");
  lines.push("Details we received:");
  lines.push("Name: " + name);
  if (age) lines.push("Age: " + age);
  if (country) lines.push("Country: " + country);
  if (timing) lines.push("Timing: " + timing);
  if (program) lines.push("Program: " + program);
  if (contact) lines.push("Contact: " + contact);
  lines.push("");
  lines.push("We will share the session link shortly.");

  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: lines.join("\n")
  });

  return jsonOut({ ok: true }, 200);
}

function jsonOut(payload, status) {
  var output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
