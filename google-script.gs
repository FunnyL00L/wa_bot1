// =========================================================================
// GOOGLE APPS SCRIPT FOR WA BOT & EXPENSE TRACKER
// =========================================================================
// CARA PENGGUNAAN:
// 1. Buka Google Sheets (spreadsheet baru atau yang ada).
// 2. Klik menu: Ekstensi -> Apps Script.
// 3. Hapus semua kode default, lalu salin (paste) seluruh isi file ini.
// 4. Klik tombol "Terapkan" (Deploy) -> "Terapkan Sebagai Aplikasi Web" (New Deployment).
// 5. Pilih Akses (Who has access): "Siapa Saja" (Anyone).
// 6. Klik Terapkan, lalu salin URL Web App (berawal dari https://script.google.com/macros/s/.../exec).
// 7. Tempelkan URL tersebut ke dalam Dashboard WA Bot pada tab "Google Sheets".
// =========================================================================

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'get_expenses') {
    var sheet = getOrCreateSheet(ss, 'Pengeluaran', ['ID Transaksi', 'Tanggal', 'Merchant/Toko', 'Rincian Items', 'Total (Rp)', 'Pengirim', 'Waktu Record']);
    var data = sheet.getDataRange().getValues();
    var expenses = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        var itemsParsed = [];
        try { itemsParsed = JSON.parse(data[i][3]); } catch (err) { itemsParsed = []; }
        expenses.push({
          id: String(data[i][0]),
          tanggal: String(data[i][1]),
          merchant: String(data[i][2]),
          items: itemsParsed,
          total: Number(data[i][4]) || 0,
          senderJid: String(data[i][5]),
          timestamp: String(data[i][6])
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ expenses: expenses }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'active', message: 'Google Apps Script WA Bot Ready' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'add_expense') {
      var sheet = getOrCreateSheet(ss, 'Pengeluaran', ['ID Transaksi', 'Tanggal', 'Merchant/Toko', 'Rincian Items', 'Total (Rp)', 'Pengirim', 'Waktu Record']);
      var trx = contents.data || {};
      sheet.appendRow([
        trx.id || ('trx_' + Date.now()),
        trx.tanggal || new Date().toISOString().split('T')[0],
        trx.merchant || 'Toko',
        JSON.stringify(trx.items || []),
        Number(trx.total) || 0,
        trx.senderJid || '',
        trx.timestamp || new Date().toISOString()
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'save_dataset') {
      var dSheet = getOrCreateSheet(ss, 'Dataset_Pengetahuan', ['Judul / Kata Kunci', 'Informasi / Pengetahuan']);
      dSheet.clearContents();
      dSheet.appendRow(['Judul / Kata Kunci', 'Informasi / Pengetahuan']);
      var kb = contents.knowledgeBase || [];
      for (var k = 0; k < kb.length; k++) {
        dSheet.appendRow([kb[k].deskripsi || '', kb[k].konten || '']);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'save_schedule') {
      var sSheet = getOrCreateSheet(ss, 'Jadwal_Harian', ['Status Aktif', 'Jam Kirim', 'Target Nomor', 'Template Pesan']);
      sSheet.clearContents();
      sSheet.appendRow(['Status Aktif', 'Jam Kirim', 'Target Nomor', 'Template Pesan']);
      var sch = contents.schedule || {};
      sSheet.appendRow([
        sch.aktif ? 'AKTIF' : 'NONAKTIF',
        sch.jam || '08:00',
        (sch.targetNomor || []).join(', '),
        sch.templatePesan || ''
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#059669');
      headerRange.setFontColor('#FFFFFF');
    }
  }
  return sheet;
}
