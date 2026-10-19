import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHours, statusAt, formatMinutes } from '../src/lib/hours.mjs';

const at = (text, hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return statusAt(parseHours(text), h * 60 + m);
};

test('always-open spellings are open at any time', () => {
  for (const s of ['24시간', '연중무휴', '00:00~24:00', '상시', '상시개방', '종일개방', '24', '00:00-24:00', '00:00~23:59', '주야', '24:00:00']) {
    assert.equal(parseHours(s).kind, 'always', s);
    assert.equal(at(s, '03:15'), 'open', s);
  }
});

test('a plain range is open inside and closed outside', () => {
  assert.equal(at('09:00~18:00', '10:00'), 'open');
  assert.equal(at('09:00~18:00', '18:00'), 'closed');
  assert.equal(at('09:00~18:00', '22:00'), 'closed');
  assert.equal(at('09:00-18:00', '22:00'), 'closed');
  assert.equal(at('09:00∼18:00', '12:00'), 'open');
  assert.equal(at('09:00 ~ 18:00', '12:00'), 'open');
});

test('ranges without minutes or colons', () => {
  assert.equal(at('09~18', '12:00'), 'open');
  assert.equal(at('09~18', '19:00'), 'closed');
  assert.equal(at('(평일)0900~1800', '12:00'), 'open');
  assert.equal(at('9:00~18:00', '08:59'), 'closed');
  assert.equal(at('09시~18시', '17:59'), 'open');
});

test('overnight ranges', () => {
  assert.equal(at('05:00~01:00', '23:30'), 'open');
  assert.equal(at('05:00~01:00', '00:30'), 'open');
  assert.equal(at('05:00~01:00', '03:00'), 'closed');
  assert.equal(at('06:00~24:00', '23:59'), 'open');
  assert.equal(at('06:00~24:00', '05:59'), 'closed');
});

test('day-tagged strings use the first readable range', () => {
  assert.equal(at('(평일)09:00~18:00+(주말)09:00~18:00+(공휴일)09:00~18:00', '10:00'), 'open');
  assert.equal(at('(평일)09:00~18:00+(주말)09:00~18:00+(공휴일)09:00~18:00', '22:00'), 'closed');
  assert.equal(at('정시(09:00~18:00, 평일만)', '12:00'), 'open');
  assert.equal(at('평일09:00~18:00', '22:00'), 'closed');
});

test('unreadable text is unknown, never a guess', () => {
  for (const s of ['-', '데이터없음', '8시간', '영업시간내', '업무중', ':~:', '주', '0', '9', '하절기(7~9월)', '']) {
    assert.equal(parseHours(s).kind, 'unknown', s);
    assert.equal(at(s, '12:00'), 'unknown', s);
  }
});

test('formatMinutes pads', () => {
  assert.equal(formatMinutes(0), '00:00');
  assert.equal(formatMinutes(22 * 60 + 5), '22:05');
});
