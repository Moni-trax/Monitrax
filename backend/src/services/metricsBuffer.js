const config = require("../config");

let _buffer = [];
const MAX_SIZE = config.historySize;

function push(snapshot) {
  _buffer.push(snapshot);
  if (_buffer.length > MAX_SIZE) {
    _buffer.shift();
  }
}

function getAll() {
  return _buffer.slice().reverse();
}

function getLast() {
  if (_buffer.length === 0) return null;
  return _buffer[_buffer.length - 1];
}

function clear() {
  _buffer = [];
}

module.exports = { push, getAll, getLast, clear };
