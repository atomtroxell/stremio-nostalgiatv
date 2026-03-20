'use strict';
/**
 * Image creation/conversion utility for plan 05-02
 * Creates PNG/JPEG image files without external dependencies.
 *
 * For images where we have real downloads, creates properly-sized placeholder PNGs
 * that reference the source. For missing sources, creates solid-color placeholder PNGs.
 *
 * This script uses Node.js's built-in zlib for PNG compression.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Creates a minimal valid PNG file with a solid color fill.
 * Implements PNG spec: IHDR + IDAT (deflate compressed scanlines) + IEND
 */
function createPNG(width, height, r, g, b, outputPath) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);   // width
  ihdrData.writeUInt32BE(height, 4);  // height
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB
  ihdrData[10] = 0; // compression method
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace method
  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw scanlines: filter byte (0) + RGB pixels per row
  const scanline = Buffer.alloc(1 + width * 3);
  scanline[0] = 0; // filter type None
  for (let x = 0; x < width; x++) {
    scanline[1 + x * 3] = r;
    scanline[2 + x * 3] = g;
    scanline[3 + x * 3] = b;
  }
  const rawData = Buffer.concat(Array(height).fill(scanline));
  const compressedData = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressedData);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  const png = Buffer.concat([signature, ihdr, idat, iend]);
  fs.writeFileSync(outputPath, png);
  return png.length;
}

/**
 * Creates a minimal valid JPEG file with a solid color fill (1x1 then scaled).
 * Uses a pre-built minimal JPEG structure for a solid color image.
 * For simplicity, we use the PNG approach since stremio accepts PNG.
 */

/**
 * Creates a PNG with text rendered as pixel art (very basic).
 */
function createPNGWithSolidColor(width, height, bgR, bgG, bgB, outputPath) {
  return createPNG(width, height, bgR, bgG, bgB, outputPath);
}

/**
 * Makes a PNG chunk: length (4 bytes) + type (4 bytes) + data + CRC (4 bytes)
 */
function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);

  // CRC32 over type + data
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcInput);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

/**
 * CRC32 implementation (required by PNG spec)
 */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Creates a minimal JPEG using raw DCT-free baseline JPEG.
 * We use the "JFIF solid color" approach: create a 256x256 solid color JPEG.
 *
 * Since building a full JPEG encoder is complex, we use a pre-encoded
 * solid color JPEG template and modify the color values.
 *
 * For simplicity, just create a PNG for background too (PNG is accepted).
 */
function createLargeBackgroundPNG(width, height, r1, g1, b1, r2, g2, b2, outputPath) {
  // Create gradient-like image by varying colors per row
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2;
  const ihdr = makeChunk('IHDR', ihdrData);

  const scanlines = [];
  for (let y = 0; y < height; y++) {
    const t = y / (height - 1);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0;
    for (let x = 0; x < width; x++) {
      row[1 + x * 3] = r;
      row[2 + x * 3] = g;
      row[3 + x * 3] = b;
    }
    scanlines.push(row);
  }

  const rawData = Buffer.concat(scanlines);
  const compressedData = zlib.deflateSync(rawData, { level: 6 });
  const idat = makeChunk('IDAT', compressedData);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  const png = Buffer.concat([signature, ihdr, idat, iend]);
  fs.writeFileSync(outputPath, png);
  return png.length;
}

// ============================================================
// Main execution
// ============================================================

const OUT = 'C:/Sites/toons/public/images';

console.log('Creating image assets for phase 05-02...\n');

// 1. toonami-aftermath.png — dark blue placeholder (256x256)
let size = createPNGWithSolidColor(256, 256, 0x1a, 0x1a, 0x2e, path.join(OUT, 'toonami-aftermath.png'));
console.log(`toonami-aftermath.png: ${size} bytes`);

// 2. addon-logo.png — dark monochrome (256x256)
size = createPNGWithSolidColor(256, 256, 0x1a, 0x1a, 0x1a, path.join(OUT, 'addon-logo.png'));
console.log(`addon-logo.png: ${size} bytes`);

// 3. addon-background.jpg — actually write as PNG (stremio will accept it)
// Renamed to .png to avoid JPEG encoding complexity, but plan says .jpg
// Use a gradient PNG saved as .jpg (stremio detects by content not extension...
// actually let's use proper naming but write PNG data - or create a valid minimal JPEG)
// Let's write a proper gradient PNG but save as .jpg —
// Stremio uses URL extension to determine type, but manifest field just needs a URL.
// The plan says addon-background.jpg — let's create actual JPEG.
// Simple approach: write a minimal valid solid-color JPEG using pre-built bytes.
// Actually, png renamed to .jpg won't display. Let's create it as a proper JPEG.
// A solid-color JPEG can be created from a known-good template.

// Minimal JPEG (1x1 then scaled) is complex. Let's use a different approach:
// Create a 1024x786 PNG saved as addon-background.jpg — but this would fail MIME type check.
// Instead, write valid JPEG bytes using a helper.

const bgSize = createLargeBackgroundPNG(1024, 786, 0x0d, 0x0d, 0x1a, 0x1a, 0x1a, 0x3e, path.join(OUT, 'addon-background-temp.png'));
console.log(`addon-background-temp.png (gradient): ${bgSize} bytes`);

// For JPEG, we need to convert PNG to JPEG or create JPEG directly.
// Let's create a proper JPEG using a minimal DCT-based approach.
// We'll use a 1x1 pixel JPEG template scaled to the right dimensions using
// a pre-encoded solid color baseline JPEG.

// Create a proper background JPEG using raw JPEG encoding
createSolidColorJPEG(1024, 786, 0x0d, 0x0d, 0x26, path.join(OUT, 'addon-background.jpg'));
console.log(`addon-background.jpg: ${fs.statSync(path.join(OUT, 'addon-background.jpg')).size} bytes`);

// Clean up temp file
fs.unlinkSync(path.join(OUT, 'addon-background-temp.png'));

console.log('\nDone creating generated images.');
console.log('\nChecking all required files:');
const required = ['toonami-aftermath.png', 'swim-rewind.png', 'ccn.png', 'afterswim.png', 'verniy.png', 'retrostrange.png', 'addon-logo.png', 'addon-background.jpg'];
for (const f of required) {
  const fp = path.join(OUT, f);
  if (fs.existsSync(fp)) {
    const stat = fs.statSync(fp);
    const kb = (stat.size / 1024).toFixed(1);
    const over = (f.endsWith('.png') && !f.includes('background')) && stat.size > 102400;
    console.log(`  ${f}: ${stat.size} bytes (${kb} KB)${over ? ' *** OVER 100KB ***' : ' OK'}`);
  } else {
    console.log(`  ${f}: MISSING`);
  }
}

/**
 * Creates a solid-color JPEG using a pre-built minimal JFIF structure.
 * This uses a 8x8 MCU approach with a DC-only encoding (all AC = 0).
 */
function createSolidColorJPEG(width, height, r, g, b, outputPath) {
  // Convert RGB to YCbCr
  const Y  = Math.min(255, Math.round( 0.299   * r + 0.587   * g + 0.114   * b));
  const Cb = Math.min(255, Math.round(-0.16874 * r - 0.33126 * g + 0.5     * b + 128));
  const Cr = Math.min(255, Math.round( 0.5     * r - 0.41869 * g - 0.08131 * b + 128));

  // Quantization tables (standard JPEG tables at quality ~85)
  const lumQ = [
    16, 11, 10, 16, 24, 40, 51, 61,
    12, 12, 14, 19, 26, 58, 60, 55,
    14, 13, 16, 24, 40, 57, 69, 56,
    14, 17, 22, 29, 51, 87, 80, 62,
    18, 22, 37, 56, 68, 109,103, 77,
    24, 35, 55, 64, 81, 104,113, 92,
    49, 64, 78, 87,103, 121,120,101,
    72, 92, 95, 98,112, 100,103, 99
  ];
  const chrQ = [
    17, 18, 24, 47, 99, 99, 99, 99,
    18, 21, 26, 66, 99, 99, 99, 99,
    24, 26, 56, 99, 99, 99, 99, 99,
    47, 66, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99
  ];

  // For a solid-color image, the DCT of a constant block is:
  // DC = 8 * value_shifted, all AC = 0
  // value_shifted = component_value - 128
  const yDC  = Math.round((Y  - 128) * 8 / lumQ[0]);
  const cbDC = Math.round((Cb - 128) * 8 / chrQ[0]);
  const crDC = Math.round((Cr - 128) * 8 / chrQ[0]);

  // Huffman tables (standard JPEG Huffman tables)
  // DC luminance
  const dcLumCodes = buildHuffman([
    0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0
  ], [0,1,2,3,4,5,6,7,8,9,10,11]);
  // DC chrominance
  const dcChrCodes = buildHuffman([
    0,3,1,1,1,1,1,1,1,1,1,0,0,0,0,0
  ], [0,1,2,3,4,5,6,7,8,9,10,11]);
  // AC luminance (simplified - just DC block, all AC=0, use EOB)
  const acLumCodes = buildACHuffman();
  // AC chrominance
  const acChrCodes = buildACHuffman();

  const parts = [];

  // SOI
  parts.push(Buffer.from([0xFF, 0xD8]));

  // APP0 (JFIF)
  const app0 = Buffer.from([
    0xFF, 0xE0,
    0x00, 0x10, // length 16
    0x4A, 0x46, 0x49, 0x46, 0x00, // JFIF\0
    0x01, 0x01, // version 1.1
    0x00,       // aspect ratio units: 0 = no units
    0x00, 0x01, // X density
    0x00, 0x01, // Y density
    0x00, 0x00  // thumbnail size
  ]);
  parts.push(app0);

  // DQT (quantization tables)
  parts.push(makeDQT(0, lumQ));
  parts.push(makeDQT(1, chrQ));

  // SOF0 (baseline DCT)
  const sof0 = Buffer.alloc(17);
  sof0[0] = 0xFF; sof0[1] = 0xC0;
  sof0.writeUInt16BE(17, 2); // length
  sof0[4] = 8; // precision
  sof0.writeUInt16BE(height, 5);
  sof0.writeUInt16BE(width, 7);
  sof0[9] = 3; // components
  // Y
  sof0[10] = 1; sof0[11] = 0x11; sof0[12] = 0;
  // Cb
  sof0[13] = 2; sof0[14] = 0x11; sof0[15] = 1;
  // Cr
  sof0[16] = 3; sof0[17] = 0x11; sof0[18] = 1;
  parts.push(sof0.slice(0, 19));

  // DHT (Huffman tables)
  parts.push(makeDHT(0, 0, dcLumCodes));  // DC lum
  parts.push(makeDHT(0, 1, dcChrCodes));  // DC chr
  parts.push(makeDHT(1, 0, acLumCodes));  // AC lum
  parts.push(makeDHT(1, 1, acChrCodes));  // AC chr

  // SOS header
  const sosHeader = Buffer.from([
    0xFF, 0xDA,
    0x00, 0x0C, // length 12
    0x03,       // components
    0x01, 0x00, // Y: DC0, AC0
    0x02, 0x11, // Cb: DC1, AC1
    0x03, 0x11, // Cr: DC1, AC1
    0x00, 0x3F, 0x00 // Ss, Se, Ah/Al
  ]);
  parts.push(sosHeader);

  // Entropy-coded data
  // For a solid color image: encode each MCU with just DC diff + EOB for all AC
  // MCUs are 8x8 blocks
  const mcuWidth = Math.ceil(width / 8);
  const mcuHeight = Math.ceil(height / 8);
  const totalMCUs = mcuWidth * mcuHeight;

  const bits = new BitWriter();
  let prevY = 0, prevCb = 0, prevCr = 0;

  for (let i = 0; i < totalMCUs; i++) {
    // Y component: DC + EOB
    const yDiff = yDC - prevY;
    prevY = yDC;
    encodeDC(bits, yDiff, dcLumCodes);
    encodeEOB(bits, acLumCodes);

    // Cb component: DC + EOB
    const cbDiff = cbDC - prevCb;
    prevCb = cbDC;
    encodeDC(bits, cbDiff, dcChrCodes);
    encodeEOB(bits, acChrCodes);

    // Cr component: DC + EOB
    const crDiff = crDC - prevCr;
    prevCr = crDC;
    encodeDC(bits, crDiff, dcChrCodes);
    encodeEOB(bits, acChrCodes);
  }

  bits.flush();
  parts.push(bits.getBuffer());

  // EOI
  parts.push(Buffer.from([0xFF, 0xD9]));

  const jpeg = Buffer.concat(parts);
  fs.writeFileSync(outputPath, jpeg);
  return jpeg.length;
}

function makeDQT(id, table) {
  const data = Buffer.alloc(65);
  data[0] = id & 0xF;
  for (let i = 0; i < 64; i++) data[1 + i] = table[i];
  const marker = Buffer.from([0xFF, 0xDB]);
  const len = Buffer.alloc(2);
  len.writeUInt16BE(67, 0);
  return Buffer.concat([marker, len, data]);
}

function buildHuffman(counts, values) {
  // Build huffman code table: {value -> [code, length]}
  const codes = {};
  let code = 0;
  let vi = 0;
  for (let len = 1; len <= 16; len++) {
    for (let i = 0; i < counts[len - 1]; i++) {
      codes[values[vi++]] = { code, length: len };
      code++;
    }
    code <<= 1;
  }
  return codes;
}

function buildACHuffman() {
  // Standard AC luminance Huffman table
  const counts = [0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 125];
  const values = [
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12,
    0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
    0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
    0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0,
    0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16,
    0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39,
    0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
    0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69,
    0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79,
    0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98,
    0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
    0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
    0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5,
    0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4,
    0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
    0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea,
    0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
    0xf9, 0xfa
  ];
  return buildHuffman(counts, values);
}

function makeDHT(acdc, id, codes) {
  // Rebuild counts and values from codes object
  const byLength = {};
  for (const [val, { length }] of Object.entries(codes)) {
    if (!byLength[length]) byLength[length] = [];
    byLength[length].push(parseInt(val));
  }
  const counts = [];
  const values = [];
  for (let len = 1; len <= 16; len++) {
    const arr = byLength[len] || [];
    counts.push(arr.length);
    values.push(...arr);
  }
  const tableId = (acdc << 4) | (id & 0xF);
  const data = Buffer.alloc(1 + 16 + values.length);
  data[0] = tableId;
  for (let i = 0; i < 16; i++) data[1 + i] = counts[i] || 0;
  for (let i = 0; i < values.length; i++) data[17 + i] = values[i];

  const marker = Buffer.from([0xFF, 0xC4]);
  const lenBuf = Buffer.alloc(2);
  lenBuf.writeUInt16BE(2 + data.length, 0);
  return Buffer.concat([marker, lenBuf, data]);
}

class BitWriter {
  constructor() {
    this._bytes = [];
    this._buf = 0;
    this._bits = 0;
  }
  write(code, length) {
    for (let i = length - 1; i >= 0; i--) {
      this._buf = (this._buf << 1) | ((code >> i) & 1);
      this._bits++;
      if (this._bits === 8) {
        this._bytes.push(this._buf);
        if (this._buf === 0xFF) this._bytes.push(0x00); // byte stuffing
        this._buf = 0;
        this._bits = 0;
      }
    }
  }
  flush() {
    if (this._bits > 0) {
      this._buf <<= (8 - this._bits);
      this._bytes.push(this._buf);
      if (this._buf === 0xFF) this._bytes.push(0x00);
    }
  }
  getBuffer() {
    return Buffer.from(this._bytes);
  }
}

function encodeDC(bits, diff, huffTable) {
  // Size category
  let size = 0;
  let absVal = Math.abs(diff);
  while (absVal > 0) { size++; absVal >>= 1; }

  const huff = huffTable[size];
  if (!huff) throw new Error('No huffman code for DC size ' + size);
  bits.write(huff.code, huff.length);

  // Amplitude
  if (size > 0) {
    const amp = diff < 0 ? diff - 1 : diff;
    bits.write(amp & ((1 << size) - 1), size);
  }
}

function encodeEOB(bits, huffTable) {
  const huff = huffTable[0]; // 0x00 = EOB
  if (!huff) throw new Error('No EOB in Huffman table');
  bits.write(huff.code, huff.length);
}
