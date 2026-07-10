import assert from 'node:assert/strict';
import test from 'node:test';
import { markdownCodeSpan, markdownTableCell } from './markdown.mjs';

test('markdownTableCell escapes table separators and line breaks', () => {
  assert.equal(markdownTableCell('pipe|newline\r\nvalue\nnext'), 'pipe\\|newline<br>value<br>next');
});

test('markdownTableCell handles nullish values as empty cells', () => {
  assert.equal(markdownTableCell(null), '');
  assert.equal(markdownTableCell(undefined), '');
});

test('markdownCodeSpan escapes pipes and chooses a longer fence than the content', () => {
  assert.equal(markdownCodeSpan('tick`pipe|value'), '``tick`pipe\\|value``');
});

test('markdownCodeSpan supports runs of multiple backticks', () => {
  assert.equal(markdownCodeSpan('before``after'), '```before``after```');
});

test('markdownCodeSpan pads values that start or end with backticks', () => {
  assert.equal(markdownCodeSpan('`'), '`` ` ``');
  assert.equal(markdownCodeSpan('`edge`'), '`` `edge` ``');
});

test('markdownCodeSpan normalizes line breaks before fencing', () => {
  assert.equal(markdownCodeSpan('one\r\ntwo\nthree'), '`one two three`');
});

test('markdownCodeSpan leaves nullish and empty values unfenced', () => {
  assert.equal(markdownCodeSpan(null), '');
  assert.equal(markdownCodeSpan(undefined), '');
  assert.equal(markdownCodeSpan(''), '');
});

test('markdown helpers stringify non-string scalar values', () => {
  assert.equal(markdownTableCell(42), '42');
  assert.equal(markdownCodeSpan(false), '`false`');
});
