// Workshop seat inventory via Google Apps Script
// Script Properties:
// WORKSHOP_SEAT_SPREADSHEET_ID
// WORKSHOP_SEAT_SHEET_NAME (optional, defaults to WorkshopSeats)

function doPost(e) {
  try {
    var body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = body.action || "";

    if (action === "get_workshop_seats") {
      return jsonOut_(getWorkshopSeats_(body.slot_keys || []));
    }

    if (action === "confirm_workshop_seat") {
      return jsonOut_(confirmWorkshopSeat_(body.slot_key || ""));
    }

    return jsonOut_({ ok: false, error: "Unknown action." });
  } catch (err) {
    return jsonOut_({ ok: false, error: err && err.message ? err.message : "Unknown error." });
  }
}

function getSeatSheet_() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty("WORKSHOP_SEAT_SPREADSHEET_ID");
  var sheetName = props.getProperty("WORKSHOP_SEAT_SHEET_NAME") || "WorkshopSeats";

  if (!spreadsheetId) {
    throw new Error("Missing WORKSHOP_SEAT_SPREADSHEET_ID in Script Properties.");
  }

  var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Workshop seat sheet not found: " + sheetName);
  }

  return sheet;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["slot_key", "seats_left", "updated_at"]);
  }
}

function readSeatMap_(sheet) {
  ensureHeaders_(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return {};

  var values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  var seatMap = {};
  values.forEach(function (row) {
    var slotKey = String(row[0] || "").trim();
    if (!slotKey) return;
    var seatsLeft = Number(row[1]);
    seatMap[slotKey] = {
      seats_left: Number.isFinite(seatsLeft) ? Math.max(0, seatsLeft) : 15,
      rowIndex: values.indexOf(row) + 2,
    };
  });
  return seatMap;
}

function getWorkshopSeats_(slotKeys) {
  var sheet = getSeatSheet_();
  var seatMap = readSeatMap_(sheet);
  var result = {};

  (slotKeys || []).forEach(function (slotKey) {
    var key = String(slotKey || "").trim();
    if (!key) return;
    if (!seatMap[key]) {
      result[key] = 15;
      return;
    }
    result[key] = seatMap[key].seats_left;
  });

  return { ok: true, seats: result };
}

function confirmWorkshopSeat_(slotKey) {
  var key = String(slotKey || "").trim();
  if (!key) {
    return { ok: false, error: "Missing slot key." };
  }

  var sheet = getSeatSheet_();
  var seatMap = readSeatMap_(sheet);
  var existing = seatMap[key];
  var nextSeats = existing ? Math.max(0, existing.seats_left - 1) : 14;
  var timestamp = new Date();

  if (existing) {
    sheet.getRange(existing.rowIndex, 2, 1, 2).setValues([[nextSeats, timestamp]]);
  } else {
    sheet.appendRow([key, nextSeats, timestamp]);
  }

  return { ok: true, slot_key: key, seats_left: nextSeats };
}

function jsonOut_(payload) {
  var output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
