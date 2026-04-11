/**
 * お客様カード - Google Apps Script
 *
 * 【設定手順】
 * 1. https://script.google.com で既存プロジェクトを開く
 * 2. このコードで全て上書き保存（Ctrl+S）
 * 3. 「デプロイ」→「デプロイを管理」→ 鉛筆アイコン
 * 4. バージョン: 「新しいバージョン」に変更 → 「デプロイ」
 * ※ URLは変わりません
 */

const SPREADSHEET_ID = '1hg34DWGdEGcvUjqT3WeZAKBGtvmVi-73fJFZS5fd2D4';
const SHEET_CUSTOMER = '顧客情報';
const SHEET_PURCHASE = '購入明細';

// GET リクエストで受け取る（?data=JSON文字列）
function doGet(e) {
  try {
    // データがない場合は疎通確認として OK を返す
    if (!e || !e.parameter || !e.parameter.data) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', message: 'Apps Script 動作中' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.parameter.data);
    writeToSheet(data);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // エラーをログに残す
    Logger.log('エラー: ' + err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// スプレッドシートへの書き込み処理
function writeToSheet(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const now = new Date();
  const timestamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

  // ---- 顧客情報シート ----
  let sheetCustomer = ss.getSheetByName(SHEET_CUSTOMER);
  if (!sheetCustomer) {
    sheetCustomer = ss.insertSheet(SHEET_CUSTOMER);
    sheetCustomer.appendRow([
      '登録日時', '来店日', '担当者',
      'フリガナ（姓）', 'フリガナ（名）', 'お名前（姓）', 'お名前（名）', '性別',
      '郵便番号', '住所1', '住所2',
      '電話番号', '携帯番号', 'お誕生日', 'メールアドレス',
      'お肌のお悩み', 'ご要望',
      '個人情報同意1', '個人情報同意2', 'サービス同意',
      '合計(税抜)', '合計(税込)'
    ]);
    const header = sheetCustomer.getRange(1, 1, 1, 22);
    header.setBackground('#4a7c59');
    header.setFontColor('#ffffff');
    header.setFontWeight('bold');
    sheetCustomer.setFrozenRows(1);
  }

  sheetCustomer.appendRow([
    timestamp,
    data.date        || '',
    data.staff       || '',
    data.furiganaSei || '',
    data.furiganaMei || '',
    data.nameSei     || '',
    data.nameMei     || '',
    data.gender      || '',
    data.postal      || '',
    data.address1    || '',
    data.address2    || '',
    data.tel         || '',
    data.mobile      || '',
    data.birthday    || '',
    data.email       || '',
    data.skinConcerns || '',
    data.requests    || '',
    data.agreePrivacy1 ? '✓' : '',
    data.agreePrivacy2 ? '✓' : '',
    data.agreeService  ? '✓' : '',
    data.totalExTax  || 0,
    data.totalIncTax || 0
  ]);

  // ---- 購入明細シート ----
  if (data.products && data.products.length > 0) {
    let sheetPurchase = ss.getSheetByName(SHEET_PURCHASE);
    if (!sheetPurchase) {
      sheetPurchase = ss.insertSheet(SHEET_PURCHASE);
      sheetPurchase.appendRow([
        '登録日時', '来店日', '担当者', 'お名前',
        '商品名', '色番・バリアント', '単価(税抜)', '数量', '小計(税抜)', '小計(税込)'
      ]);
      const header = sheetPurchase.getRange(1, 1, 1, 10);
      header.setBackground('#4a7c59');
      header.setFontColor('#ffffff');
      header.setFontWeight('bold');
      sheetPurchase.setFrozenRows(1);
    }

    data.products.forEach(function(product) {
      sheetPurchase.appendRow([
        timestamp,
        data.date    || '',
        data.staff   || '',
        data.name    || '',
        product.name    || '',
        product.variant || '',
        product.price   || 0,
        product.qty     || 0,
        product.subtotal || 0,
        Math.floor((product.subtotal || 0) * 1.1)
      ]);
    });
  }
}
