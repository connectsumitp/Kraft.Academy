// Razorpay Orders + Confirmation Email via Google Apps Script
// Deploy as Web App (execute as: Me, access: Anyone)
// Set Script Properties:
// RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, WORKSHOP_SESSION_LINK

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

  var props = PropertiesService.getScriptProperties();
  var name = body.name || "Student";
  var purpose = body.purpose || "workshop";
  var date = body.date || "";
  var timing = body.timing || "";
  var country = body.country || "";
  var contact = body.contact || "";
  var age = body.age || "";
  var program = body.program || "";
  var workshopSessionLink = props.getProperty('WORKSHOP_SESSION_LINK') || "";
  var workshopCalendarLink = buildWorkshopCalendarLink_(date, timing, workshopSessionLink);

  var isProgram = purpose === "program";
  var subject = isProgram ? "Kraft Academy | Program Registration Confirmed" : "Kraft Academy | Workshop Seat Reserved";
  var lines = [];
  var html = [];

  if (isProgram) {
    lines.push("Thank you for registering in our program.");
    lines.push("We will reach to you with the batch dates.");
    lines.push("");
    lines.push("Details we received:");
    lines.push("Name: " + name);
    if (age) lines.push("Age: " + age);
    if (country) lines.push("Country: " + country);
    if (timing) lines.push("Timing Preference: " + timing);
    if (program) lines.push("Program: " + program);
    if (contact) lines.push("Contact: " + contact);
    lines.push("");
    lines.push("In case of enquiries, reply to this email or use the WhatsApp / Mail icons on the website.");

    html.push("<p>Thank you for registering in our program.</p>");
    html.push("<p>We will reach to you with the batch dates.</p>");
  } else {
    lines.push("Thank you! Your seat has been reserved.");
    lines.push("");
    lines.push("Details we received:");
    lines.push("Name: " + name);
    if (age) lines.push("Age: " + age);
    if (country) lines.push("Country: " + country);
    if (date) lines.push("Date: " + date);
    if (timing) lines.push("Timing: " + timing);
    if (contact) lines.push("Contact: " + contact);
    if (workshopSessionLink) lines.push("Session Link: " + workshopSessionLink);
    if (workshopCalendarLink) lines.push("Add to Calendar: " + workshopCalendarLink);
    lines.push("");
    lines.push("Please keep this email for reference.");

    html.push("<p>Thank you! Your seat has been reserved.</p>");
    html.push("<p>Here are your workshop details:</p>");
  }

  html.push("<ul>");
  html.push("<li><strong>Name:</strong> " + escapeHtml_(name) + "</li>");
  if (age) html.push("<li><strong>Age:</strong> " + escapeHtml_(age) + "</li>");
  if (country) html.push("<li><strong>Country:</strong> " + escapeHtml_(country) + "</li>");
  if (date && !isProgram) html.push("<li><strong>Date:</strong> " + escapeHtml_(date) + "</li>");
  if (timing) html.push("<li><strong>Timing:</strong> " + escapeHtml_(timing) + "</li>");
  if (program) html.push("<li><strong>Program:</strong> " + escapeHtml_(program) + "</li>");
  if (contact) html.push("<li><strong>Contact:</strong> " + escapeHtml_(contact) + "</li>");
  html.push("</ul>");

  if (!isProgram && workshopSessionLink) {
    html.push('<p><strong>Session Link:</strong> <a href="' + workshopSessionLink + '">' + workshopSessionLink + '</a></p>');
  }
  if (!isProgram && workshopCalendarLink) {
    html.push('<p><strong>Add to Calendar:</strong> <a href="' + workshopCalendarLink + '">Add to Calendar</a></p>');
  }
  if (isProgram) {
    html.push("<p>In case of enquiries, reply to this email or use the WhatsApp / Mail icons on the website.</p>");
  } else {
    html.push("<p>Please keep this email for reference.</p>");
  }

  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: lines.join("\n"),
    htmlBody: html.join("")
  });

  return jsonOut({ ok: true }, 200);
}

function buildWorkshopCalendarLink_(date, timing, sessionLink) {
  if (!date || !timing) return "";

  var parsed = parseTimingSelection_(date, timing);
  if (!parsed) return "";

  var title = "Kraft Academy AI Workshop";
  var details = sessionLink ? "Join the session here: " + sessionLink : "Kraft Academy AI Workshop";
  var baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";

  return baseUrl
    + "&text=" + encodeURIComponent(title)
    + "&dates=" + parsed.start + "/" + parsed.end
    + "&ctz=" + encodeURIComponent(parsed.timeZone)
    + "&details=" + encodeURIComponent(details)
    + "&location=" + encodeURIComponent(sessionLink || "Online");
}

function parseTimingSelection_(date, timing) {
  var match = String(timing).match(/^(.+?)\s-\s(.+?)\s\(([^)]+)\)$/);
  if (!match) return null;

  var startTime = match[1].trim();
  var endTime = match[2].trim();
  var label = match[3].trim();
  var timeZone = getTimeZoneFromLabel_(label);
  if (!timeZone) return null;

  var start = buildCalendarDateTime_(date, startTime);
  var end = buildCalendarDateTime_(date, endTime);
  if (!start || !end) return null;

  return {
    start: start,
    end: end,
    timeZone: timeZone
  };
}

function buildCalendarDateTime_(date, timeValue) {
  var dateMatch = String(date).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  var timeMatch = String(timeValue).match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/i);
  if (!dateMatch || !timeMatch) return "";

  var year = dateMatch[1];
  var month = dateMatch[2];
  var day = dateMatch[3];
  var hour = Number(timeMatch[1]);
  var minute = timeMatch[2];
  var meridiem = timeMatch[3].toUpperCase();

  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  return year + month + day + "T" + padNumber_(hour) + minute + "00";
}

function getTimeZoneFromLabel_(label) {
  var map = {
    IST: "Asia/Kolkata",
    ET: "America/New_York",
    CT: "America/Chicago",
    MT: "America/Denver",
    PT: "America/Los_Angeles",
    GMT: "Europe/London",
    CET: "Europe/Berlin",
    GST: "Asia/Dubai",
    SGT: "Asia/Singapore",
    AEST: "Australia/Sydney",
    ACST: "Australia/Adelaide",
    AWST: "Australia/Perth",
    NZDT: "Pacific/Auckland",
    UTC: "UTC"
  };
  return map[label] || "";
}

function padNumber_(value) {
  return value < 10 ? "0" + value : String(value);
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonOut(payload, status) {
  var output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
