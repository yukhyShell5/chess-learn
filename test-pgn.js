const { parse } = require('pgn-parser');

const tests = [
  '1. e4 e5',
  '1. e4 e5 *',
  '[Event "Test"] 1. e4 e5',
  '1. e4',
  'e4',
  ''
];

tests.forEach(pgn => {
  try {
    console.log(`Testing: "${pgn}"`);
    const result = parse(pgn);
    console.log('Success:', result.length, 'games');
  } catch (e) {
    console.error('Failed:', e.message);
  }
  console.log('---');
});
