/**
 * Ammar's Library — Apps Script Web App API
 *
 * Deploy as Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * GET  ?action=books              → all books
 * GET  ?action=books&available=1  → only available books
 * POST ?action=add                → add a book
 * POST ?action=update             → update a book row
 * POST ?action=delete             → delete a book row
 * POST ?action=lend               → lend a book
 * POST ?action=return             → return a book
 */

var SHEET_NAME = 'Collection';
// Set this to a secret string — the frontend sends it in POST requests
var API_TOKEN = PropertiesService.getScriptProperties().getProperty('API_TOKEN') || 'CHANGE_ME';

// Column indices (0-based)
var COL = { TITLE: 0, AUTHOR: 1, EXPLANATION: 2, LANGUAGE: 3, CATEGORY: 4, LENT_TO: 5 };

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function jsonResponse(data, status) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function doGet(e) {
  var params = e.parameter || {};
  var action = params.action || 'books';

  if (action === 'books') {
    return jsonResponse(getBooks(params.available === '1'));
  }

  return jsonResponse({ error: 'Unknown action' });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: 'Invalid JSON body' });
  }

  // Auth check
  if (body.token !== API_TOKEN) {
    return jsonResponse({ error: 'Unauthorized' });
  }

  var action = body.action;

  switch (action) {
    case 'add':
      return jsonResponse(addBook(body));
    case 'update':
      return jsonResponse(updateBook(body));
    case 'delete':
      return jsonResponse(deleteBook(body));
    case 'lend':
      return jsonResponse(lendBook(body));
    case 'return':
      return jsonResponse(returnBook(body));
    default:
      return jsonResponse({ error: 'Unknown action: ' + action });
  }
}

// ── READ ──────────────────────────────────────────────

function getBooks(onlyAvailable) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var books = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[COL.TITLE]) continue; // skip empty rows

    var book = {
      row: i + 1, // 1-based sheet row for updates
      title: row[COL.TITLE],
      author: row[COL.AUTHOR],
      explanation: row[COL.EXPLANATION],
      language: row[COL.LANGUAGE],
      category: row[COL.CATEGORY],
      lentTo: row[COL.LENT_TO] || ''
    };

    if (onlyAvailable && book.lentTo) continue;
    books.push(book);
  }

  return { books: books, count: books.length };
}

// ── CREATE ────────────────────────────────────────────

function addBook(body) {
  var sheet = getSheet();
  sheet.appendRow([
    body.title || '',
    body.author || '',
    body.explanation || '',
    body.language || 'English',
    body.category || '',
    body.lentTo || ''
  ]);
  return { success: true, message: 'Book added' };
}

// ── UPDATE ────────────────────────────────────────────

function updateBook(body) {
  if (!body.row) return { error: 'row is required' };
  var sheet = getSheet();
  var row = body.row;

  if (body.title !== undefined) sheet.getRange(row, COL.TITLE + 1).setValue(body.title);
  if (body.author !== undefined) sheet.getRange(row, COL.AUTHOR + 1).setValue(body.author);
  if (body.explanation !== undefined) sheet.getRange(row, COL.EXPLANATION + 1).setValue(body.explanation);
  if (body.language !== undefined) sheet.getRange(row, COL.LANGUAGE + 1).setValue(body.language);
  if (body.category !== undefined) sheet.getRange(row, COL.CATEGORY + 1).setValue(body.category);
  if (body.lentTo !== undefined) sheet.getRange(row, COL.LENT_TO + 1).setValue(body.lentTo);

  return { success: true, message: 'Book updated' };
}

// ── DELETE ────────────────────────────────────────────

function deleteBook(body) {
  if (!body.row) return { error: 'row is required' };
  var sheet = getSheet();
  sheet.deleteRow(body.row);
  return { success: true, message: 'Book deleted' };
}

// ── LEND ──────────────────────────────────────────────

function lendBook(body) {
  if (!body.row) return { error: 'row is required' };
  if (!body.lentTo) return { error: 'lentTo is required' };
  var sheet = getSheet();
  sheet.getRange(body.row, COL.LENT_TO + 1).setValue(body.lentTo);
  return { success: true, message: 'Book lent to ' + body.lentTo };
}

// ── RETURN ────────────────────────────────────────────

function returnBook(body) {
  if (!body.row) return { error: 'row is required' };
  var sheet = getSheet();
  sheet.getRange(body.row, COL.LENT_TO + 1).setValue('');
  return { success: true, message: 'Book returned' };
}
