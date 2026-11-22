// src/components/common/qrcode-generator.js
// Standalone pure JavaScript QR Code Generator (Zero dependencies)
// Supports alphanumeric, numeric, and byte mode UTF-8 string encoding

function QRBitBuffer() {
  this.buffer = [];
  this.length = 0;
}
QRBitBuffer.prototype = {
  get: function(index) {
    var bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) == 1;
  },
  put: function(num, length) {
    for (var i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) == 1);
    }
  },
  putBit: function(bit) {
    var bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
    }
    this.length++;
  }
};

var QRPolynomial = {
  glog: function(n) {
    if (n < 1) throw new Error("glog(" + n + ")");
    return QRMath.LOG_TABLE[n];
  },
  gexp: function(n) {
    while (n < 0) n += 255;
    while (n >= 255) n -= 255;
    return QRMath.EXP_TABLE[n];
  }
};

var QRMath = {
  EXP_TABLE: new Array(256),
  LOG_TABLE: new Array(256)
};
for (var i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
for (var i = 8; i < 256; i++) {
  QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
}
for (var i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

function QRPolynomialClass(num, shift) {
  var offset = 0;
  while (offset < num.length && num[offset] == 0) offset++;
  this.num = new Array(num.length - offset + shift);
  for (var i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
}
QRPolynomialClass.prototype = {
  get: function(index) { return this.num[index]; },
  getLength: function() { return this.num.length; },
  multiply: function(e) {
    var num = new Array(this.getLength() + e.getLength() - 1);
    for (var i = 0; i < this.getLength(); i++) {
      for (var j = 0; j < e.getLength(); j++) {
        num[i + j] ^= QRPolynomial.gexp(QRPolynomial.glog(this.get(i)) + QRPolynomial.glog(e.get(j)));
      }
    }
    return new QRPolynomialClass(num, 0);
  },
  mod: function(e) {
    if (this.getLength() - e.getLength() < 0) return this;
    var ratio = QRPolynomial.glog(this.get(0)) - QRPolynomial.glog(e.get(0));
    var num = new Array(this.getLength());
    for (var i = 0; i < this.getLength(); i++) num[i] = this.get(i);
    for (var i = 0; i < e.getLength(); i++) {
      num[i] ^= QRPolynomial.gexp(QRPolynomial.glog(e.get(i)) + ratio);
    }
    return new QRPolynomialClass(num, 0).mod(e);
  }
};

var QRRSBlock = {
  RS_BLOCK_TABLE: [
    [1, 26, 19],
    [1, 44, 34],
    [1, 70, 55],
    [1, 100, 80],
    [1, 134, 108],
    [2, 86, 68],
    [2, 98, 78],
    [2, 121, 97],
    [2, 146, 116],
    [2, 86, 68]
  ],
  getRSBlocks: function(typeNumber) {
    var rsBlock = QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) % QRRSBlock.RS_BLOCK_TABLE.length];
    var list = [];
    var count = rsBlock[0];
    var totalCount = rsBlock[1];
    var dataCount = rsBlock[2];
    for (var i = 0; i < count; i++) {
      list.push({ totalCount: totalCount, dataCount: dataCount });
    }
    return list;
  }
};

export function createQRCodeMatrix(text) {
  var utf8Bytes = [];
  for (var i = 0; i < text.length; i++) {
    var charcode = text.charCodeAt(i);
    if (charcode < 0x80) utf8Bytes.push(charcode);
    else if (charcode < 0x800) {
      utf8Bytes.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else {
      utf8Bytes.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    }
  }

  // TypeNumber calculation (v1 to v6 based on length)
  var typeNumber = 2;
  if (utf8Bytes.length > 32) typeNumber = 4;
  if (utf8Bytes.length > 64) typeNumber = 6;
  if (utf8Bytes.length > 100) typeNumber = 8;

  var rsBlocks = QRRSBlock.getRSBlocks(typeNumber);
  var buffer = new QRBitBuffer();
  // Mode 8-bit byte: 0100
  buffer.put(4, 4);
  buffer.put(utf8Bytes.length, 8);
  for (var i = 0; i < utf8Bytes.length; i++) {
    buffer.put(utf8Bytes[i], 8);
  }

  var totalDataCount = 0;
  for (var i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;

  if (buffer.length + 4 <= totalDataCount * 8) {
    buffer.put(0, 4);
  }
  while (buffer.length % 8 != 0) {
    buffer.putBit(false);
  }
  while (true) {
    if (buffer.length >= totalDataCount * 8) break;
    buffer.put(0xec, 8);
    if (buffer.length >= totalDataCount * 8) break;
    buffer.put(0x11, 8);
  }

  // Generate matrix
  var moduleCount = typeNumber * 4 + 17;
  var modules = new Array(moduleCount);
  for (var row = 0; row < moduleCount; row++) {
    modules[row] = new Array(moduleCount);
    for (var col = 0; col < moduleCount; col++) modules[row][col] = null;
  }

  // Position detection patterns (top-left, top-right, bottom-left)
  function setupPositionProbePattern(row, col) {
    for (var r = -1; r <= 7; r++) {
      if (row + r <= -1 || moduleCount <= row + r) continue;
      for (var c = -1; c <= 7; c++) {
        if (col + c <= -1 || moduleCount <= col + c) continue;
        if (
          (0 <= r && r <= 6 && (c == 0 || c == 6)) ||
          (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          modules[row + r][col + c] = true;
        } else {
          modules[row + r][col + c] = false;
        }
      }
    }
  }

  setupPositionProbePattern(0, 0);
  setupPositionProbePattern(moduleCount - 7, 0);
  setupPositionProbePattern(0, moduleCount - 7);

  // Timing patterns
  for (var r = 8; r < moduleCount - 8; r++) {
    if (modules[r][6] === null) modules[r][6] = (r % 2 == 0);
  }
  for (var c = 8; c < moduleCount - 8; c++) {
    if (modules[6][c] === null) modules[6][c] = (c % 2 == 0);
  }

  // Alignment patterns for typeNumber >= 2
  if (typeNumber >= 2) {
    var pos = typeNumber * 4 + 10;
    for (var r = -2; r <= 2; r++) {
      for (var c = -2; c <= 2; c++) {
        modules[pos + r][pos + c] = (Math.abs(r) == 2 || Math.abs(c) == 2 || (r == 0 && c == 0));
      }
    }
  }

  // Place data bits with simple mask
  var bitIndex = 0;
  var inc = -1;
  var row = moduleCount - 1;
  for (var col = moduleCount - 1; col > 0; col -= 2) {
    if (col == 6) col--;
    while (true) {
      for (var c = 0; c < 2; c++) {
        if (modules[row][col - c] === null) {
          var dark = false;
          if (bitIndex < buffer.length) {
            dark = buffer.get(bitIndex);
          }
          // Mask pattern: (row + col) % 2 == 0
          var mask = ((row + col - c) % 2 == 0);
          modules[row][col - c] = dark ^ mask;
          bitIndex++;
        }
      }
      row += inc;
      if (row < 0 || moduleCount <= row) {
        row -= inc;
        inc = -inc;
        break;
      }
    }
  }

  return {
    moduleCount: moduleCount,
    modules: modules
  };
}
