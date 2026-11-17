// F1 Receipt Scanner — the receipt line parser (OCR text -> pantry items).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseReceipt, parseReceiptLine } from '../src/receipt.js';

test('expands abbreviations and reads size + unit', () => {
  const p = parseReceiptLine('CHKN THIGH FIL 500G 6.99');
  assert.ok(p);
  assert.equal(p.name, 'Chicken thighs');
  assert.equal(p.qty, 500);
  assert.equal(p.unit, 'g');
  assert.equal(p.confident, true);
});

test('keeps litres and converts cl to ml', () => {
  const milk = parseReceiptLine('MLK 2L 2.50')!;
  assert.deepEqual([milk.name, milk.qty, milk.unit], ['Milk', 2, 'L']);
  const oil = parseReceiptLine('OLIVE OIL 75CL 5.99')!;
  assert.equal(oil.qty, 750);
  assert.equal(oil.unit, 'ml');
});

test('multi-buy count multiplies the quantity', () => {
  const p = parseReceiptLine('2 X TOMATOES 1.20')!;
  assert.equal(p.name, 'Tomatoes');
  assert.equal(p.qty, 2);
});

test('fixes common OCR digit slips (letter O for zero)', () => {
  const p = parseReceiptLine('RICE 5OOG 1.99')!;
  assert.equal(p.qty, 500);
  assert.equal(p.unit, 'g');
});

test('unknown foods are kept but flagged not confident', () => {
  const p = parseReceiptLine('DRAGONFRUIT 3.20')!;
  assert.ok(p);
  assert.equal(p.confident, false);
});

test('non-food lines are dropped', () => {
  for (const line of ['SUBTOTAL 23.40', 'TOTAL 25.00', 'VISA ****1234', 'CASH 30.00', 'CHANGE 5.00', 'THANK YOU', '']) {
    assert.equal(parseReceiptLine(line), null, line);
  }
});

test('parseReceipt merges duplicate items and ignores junk', () => {
  const out = parseReceipt(['MLK 1L 1.20', 'TOTAL 9.99', 'MLK 1L 1.20', 'EGGS 6PK 2.10']);
  const milk = out.find((i) => i.name === 'Milk')!;
  assert.equal(milk.qty, 2);
  assert.equal(out.length, 2);
});

test('very long receipts do not crash the parser', () => {
  const lines = Array.from({ length: 300 }, (_, i) => `ITEM ${i} 100G 1.00`);
  assert.doesNotThrow(() => parseReceipt(lines));
});
