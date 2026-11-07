// Medu pilot counter: paste into a Google Apps Script bound to a Google Sheet (Extensions > Apps Script),
// then Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone. Put the /exec URL in
// site/index.html <meta name="medu-pilot" content="..."> and in pilot/index.html.
// Rows hold no names, places or device details: time, a random phone id, the partner code, the event, the stop.
function doPost(e) {
  var rows = JSON.parse(e.postData.contents || '[]');
  if (!Array.isArray(rows)) rows = [rows];
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('events') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('events');
  if (sh.getLastRow() === 0) sh.appendRow(['time', 'phone', 'code', 'event', 'stop']);
  rows.slice(0, 200).forEach(function (r) {
    sh.appendRow([String(r.t).slice(0, 30), String(r.id).slice(0, 12), String(r.p || '').slice(0, 24), String(r.ev).slice(0, 12), Number(r.n) || 0]);
  });
  return ContentService.createTextOutput('ok');
}
function doGet(e) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('events');
  var data = sh ? sh.getDataRange().getValues().slice(1) : [];
  var out = {};
  data.forEach(function (r) {
    var code = r[2] || '(none)', ev = r[3], n = r[4], id = r[1];
    var c = out[code] = out[code] || { open: {}, walk: {}, start: {}, end: {}, finish: {}, card: {} };
    if (ev === 'stop_start') (c.start[n] = c.start[n] || {})[id] = 1;
    else if (ev === 'stop_end') (c.end[n] = c.end[n] || {})[id] = 1;
    else if (c[ev]) c[ev][id] = 1;
  });
  var res = {};
  Object.keys(out).forEach(function (k) {
    var c = out[k], cnt = function (o) { return Object.keys(o).length; }, per = function (o) { var m = {}; Object.keys(o).forEach(function (n) { m[n] = cnt(o[n]); }); return m; };
    res[k] = { open: cnt(c.open), walk: cnt(c.walk), finish: cnt(c.finish), card: cnt(c.card), start: per(c.start), end: per(c.end) };
  });
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}
