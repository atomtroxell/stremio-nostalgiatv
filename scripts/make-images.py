"""
Image asset creation script for Phase 05-02 (Logos and Addon Icon).
Uses only Python stdlib (struct, zlib) — no external dependencies needed.

Operations:
- Creates solid-color placeholder PNG files (256x256) for missing/unusable sources
- Resizes oversized PNG files by reading PNG dimensions and downsampling with nearest-neighbor
- Converts GIF (first frame) to PNG
- Creates addon-background.jpg (saved as JPEG using minimal stdlib encoder)
"""

import struct
import zlib
import sys
import os


# ─────────────────────────────────────────────────────────────
# PNG ENCODER — creates valid PNG from raw RGBA pixel data
# ─────────────────────────────────────────────────────────────

def make_png_chunk(chunk_type, data):
    """Create a PNG chunk with CRC."""
    b = chunk_type.encode('ascii') + data
    crc = zlib.crc32(b) & 0xFFFFFFFF
    return struct.pack('>I', len(data)) + b + struct.pack('>I', crc)


def encode_png(width, height, pixels_rgb):
    """
    Encode a PNG from a flat list of (R,G,B) tuples or a bytearray of RGB data.
    pixels_rgb: list of (r,g,b) tuples, row-major
    """
    # PNG signature
    sig = b'\x89PNG\r\n\x1a\n'

    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr = make_png_chunk('IHDR', ihdr_data)

    # Build raw scanlines (filter byte 0 + RGB per pixel)
    raw_rows = []
    for y in range(height):
        row = bytearray([0])  # filter type None
        for x in range(width):
            r, g, b = pixels_rgb[y * width + x]
            row += bytes([r, g, b])
        raw_rows.append(bytes(row))

    raw_data = b''.join(raw_rows)
    compressed = zlib.compress(raw_data, 6)
    idat = make_png_chunk('IDAT', compressed)

    # IEND
    iend = make_png_chunk('IEND', b'')

    return sig + ihdr + idat + iend


def solid_color_png(width, height, r, g, b):
    """Create a solid color PNG."""
    pixels = [(r, g, b)] * (width * height)
    return encode_png(width, height, pixels)


def gradient_png(width, height, r1, g1, b1, r2, g2, b2):
    """Create a vertical gradient PNG."""
    pixels = []
    for y in range(height):
        t = y / max(height - 1, 1)
        r = int(r1 + (r2 - r1) * t)
        g = int(g1 + (g2 - g1) * t)
        b = int(b1 + (b2 - b1) * t)
        for x in range(width):
            pixels.append((r, g, b))
    return encode_png(width, height, pixels)


# ─────────────────────────────────────────────────────────────
# PNG READER — reads and resizes existing PNG files
# ─────────────────────────────────────────────────────────────

def read_png_pixels(filepath):
    """
    Parse a PNG file and return (width, height, pixels_rgb) using stdlib only.
    Supports non-interlaced RGB and RGBA PNGs.
    """
    with open(filepath, 'rb') as f:
        data = f.read()

    # Verify PNG signature
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError(f"Not a PNG file: {filepath}")

    pos = 8
    chunks = {}
    idat_chunks = []

    while pos < len(data):
        length = struct.unpack('>I', data[pos:pos+4])[0]
        chunk_type = data[pos+4:pos+8].decode('ascii', errors='replace')
        chunk_data = data[pos+8:pos+8+length]
        # CRC is data[pos+8+length:pos+12+length] — skip validation for speed
        pos += 12 + length

        if chunk_type == 'IHDR':
            chunks['IHDR'] = chunk_data
        elif chunk_type == 'IDAT':
            idat_chunks.append(chunk_data)
        elif chunk_type == 'IEND':
            break

    if 'IHDR' not in chunks:
        raise ValueError("No IHDR chunk")

    ihdr = chunks['IHDR']
    width = struct.unpack('>I', ihdr[0:4])[0]
    height = struct.unpack('>I', ihdr[4:8])[0]
    bit_depth = ihdr[8]
    color_type = ihdr[9]
    # interlace = ihdr[12]

    if bit_depth != 8:
        raise ValueError(f"Unsupported bit depth: {bit_depth}")

    # Decompress IDAT
    compressed = b''.join(idat_chunks)
    raw = zlib.decompress(compressed)

    # Determine channels from color_type
    # 2=RGB, 6=RGBA, 0=Grayscale, 3=Indexed, 4=Grayscale+Alpha
    if color_type == 2:
        channels = 3
    elif color_type == 6:
        channels = 4
    elif color_type == 0:
        channels = 1
    elif color_type == 4:
        channels = 2
    else:
        # Indexed (palette) - can't easily decode without PLTE chunk
        raise ValueError(f"Unsupported color type: {color_type} (indexed PNG not supported)")

    # Reconstruct pixels using PNG filter reconstruction
    stride = 1 + width * channels  # filter byte + row data
    pixels_raw = []

    prev_row = bytearray(width * channels)

    for y in range(height):
        start = y * stride
        filter_type = raw[start]
        row = bytearray(raw[start+1:start+1+width*channels])

        if filter_type == 0:  # None
            pass
        elif filter_type == 1:  # Sub
            for x in range(channels, len(row)):
                row[x] = (row[x] + row[x - channels]) & 0xFF
        elif filter_type == 2:  # Up
            for x in range(len(row)):
                row[x] = (row[x] + prev_row[x]) & 0xFF
        elif filter_type == 3:  # Average
            for x in range(len(row)):
                a = row[x - channels] if x >= channels else 0
                b = prev_row[x]
                row[x] = (row[x] + (a + b) // 2) & 0xFF
        elif filter_type == 4:  # Paeth
            for x in range(len(row)):
                a = row[x - channels] if x >= channels else 0
                b = prev_row[x]
                c = prev_row[x - channels] if x >= channels else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                if pa <= pb and pa <= pc:
                    pred = a
                elif pb <= pc:
                    pred = b
                else:
                    pred = c
                row[x] = (row[x] + pred) & 0xFF
        else:
            raise ValueError(f"Unknown filter type: {filter_type}")

        pixels_raw.append(bytes(row))
        prev_row = row

    # Convert to (r,g,b) tuples
    pixels = []
    for y in range(height):
        row = pixels_raw[y]
        for x in range(width):
            base = x * channels
            if channels == 3:
                pixels.append((row[base], row[base+1], row[base+2]))
            elif channels == 4:
                pixels.append((row[base], row[base+1], row[base+2]))
            elif channels == 1:
                v = row[base]
                pixels.append((v, v, v))
            elif channels == 2:
                v = row[base]
                pixels.append((v, v, v))

    return width, height, pixels


def resize_pixels(src_pixels, src_w, src_h, dst_w, dst_h):
    """Nearest-neighbor resize."""
    result = []
    for y in range(dst_h):
        sy = int(y * src_h / dst_h)
        for x in range(dst_w):
            sx = int(x * src_w / dst_w)
            result.append(src_pixels[sy * src_w + sx])
    return result


def resize_png(input_path, output_path, target_w, target_h):
    """Read PNG, resize to target dimensions, write new PNG."""
    print(f"  Reading {input_path}...", end=' ', flush=True)
    w, h, pixels = read_png_pixels(input_path)
    print(f"{w}x{h}", end=' ', flush=True)

    resized = resize_pixels(pixels, w, h, target_w, target_h)
    png_data = encode_png(target_w, target_h, resized)

    with open(output_path, 'wb') as f:
        f.write(png_data)

    print(f"-> {target_w}x{target_h} ({len(png_data)} bytes)")
    return len(png_data)


# ─────────────────────────────────────────────────────────────
# GIF READER — extracts first frame as RGB pixels
# ─────────────────────────────────────────────────────────────

def read_gif_frame0(filepath):
    """
    Parse a GIF file and return (width, height, pixels_rgb) for the first frame.
    Supports GIF87a and GIF89a with LZW decompression.
    """
    with open(filepath, 'rb') as f:
        data = f.read()

    # GIF header
    sig = data[:6]
    if sig[:3] != b'GIF':
        raise ValueError("Not a GIF file")

    canvas_w = struct.unpack('<H', data[6:8])[0]
    canvas_h = struct.unpack('<H', data[8:10])[0]
    packed = data[10]
    has_gct = (packed >> 7) & 1
    gct_size = packed & 0x7
    # bg_index = data[11]
    # aspect = data[12]

    pos = 13
    global_palette = []
    if has_gct:
        n_colors = 2 ** (gct_size + 1)
        for i in range(n_colors):
            r, g, b = data[pos], data[pos+1], data[pos+2]
            global_palette.append((r, g, b))
            pos += 3

    # Parse blocks until we hit Image Descriptor (0x2C)
    frame_w, frame_h = canvas_w, canvas_h
    frame_x, frame_y = 0, 0
    local_palette = None
    transparent_index = None

    while pos < len(data):
        block_type = data[pos]

        if block_type == 0x3B:  # Trailer
            break

        elif block_type == 0x21:  # Extension
            ext_label = data[pos+1]
            pos += 2
            if ext_label == 0xF9:  # Graphic Control Extension
                block_size = data[pos]
                pos += 1
                packed2 = data[pos]
                if (packed2 >> 0) & 1:  # transparent flag
                    transparent_index = data[pos+3]
                pos += block_size
                pos += 1  # block terminator
            else:
                # Skip extension blocks
                pos += 1
                while pos < len(data):
                    sub_size = data[pos]
                    pos += 1
                    if sub_size == 0:
                        break
                    pos += sub_size

        elif block_type == 0x2C:  # Image Descriptor
            pos += 1
            frame_x = struct.unpack('<H', data[pos:pos+2])[0]
            frame_y = struct.unpack('<H', data[pos+2:pos+4])[0]
            frame_w = struct.unpack('<H', data[pos+4:pos+6])[0]
            frame_h = struct.unpack('<H', data[pos+6:pos+8])[0]
            packed3 = data[pos+8]
            has_lct = (packed3 >> 7) & 1
            lct_size = packed3 & 0x7
            interlaced = (packed3 >> 6) & 1
            pos += 9

            local_palette = None
            if has_lct:
                n_colors = 2 ** (lct_size + 1)
                local_palette = []
                for i in range(n_colors):
                    r, g, b = data[pos], data[pos+1], data[pos+2]
                    local_palette.append((r, g, b))
                    pos += 3

            # LZW decode
            min_code_size = data[pos]
            pos += 1

            # Collect sub-blocks
            compressed = bytearray()
            while pos < len(data):
                sub_size = data[pos]
                pos += 1
                if sub_size == 0:
                    break
                compressed += data[pos:pos+sub_size]
                pos += sub_size

            # LZW decompress
            indices = lzw_decompress(bytes(compressed), min_code_size)

            # Handle interlaced
            if interlaced:
                indices = deinterlace(indices, frame_w, frame_h)

            # Map indices to RGB
            palette = local_palette if local_palette else global_palette
            canvas = [(0, 0, 0)] * (canvas_w * canvas_h)
            idx = 0
            for fy in range(frame_h):
                for fx in range(frame_w):
                    color_idx = indices[idx] if idx < len(indices) else 0
                    color = palette[color_idx] if color_idx < len(palette) else (0, 0, 0)
                    cx = frame_x + fx
                    cy = frame_y + fy
                    if 0 <= cx < canvas_w and 0 <= cy < canvas_h:
                        canvas[cy * canvas_w + cx] = color
                    idx += 1

            return canvas_w, canvas_h, canvas

        else:
            # Unknown block — skip
            pos += 1

    raise ValueError("No image frame found in GIF")


def lzw_decompress(data, min_code_size):
    """GIF LZW decompression."""
    clear_code = 1 << min_code_size
    eoi_code = clear_code + 1

    # Initialize code table
    def init_table():
        table = {i: [i] for i in range(clear_code)}
        return table, eoi_code + 1, min_code_size + 1

    code_table, next_code, code_size = init_table()

    result = []

    # Bit reader
    buf = 0
    buf_size = 0
    pos = 0

    def read_code():
        nonlocal buf, buf_size, pos
        while buf_size < code_size and pos < len(data):
            buf |= data[pos] << buf_size
            buf_size += 8
            pos += 1
        code = buf & ((1 << code_size) - 1)
        buf >>= code_size
        buf_size -= code_size
        return code

    prev_code = None

    while True:
        code = read_code()

        if code == clear_code:
            code_table, next_code, code_size = init_table()
            prev_code = None
            continue

        if code == eoi_code:
            break

        if prev_code is None:
            result.extend(code_table[code])
            prev_code = code
            continue

        if code in code_table:
            entry = code_table[code]
            result.extend(entry)
            if next_code < 4096:
                code_table[next_code] = code_table[prev_code] + [entry[0]]
                next_code += 1
                if next_code == (1 << code_size) and code_size < 12:
                    code_size += 1
        else:
            prev_entry = code_table[prev_code]
            entry = prev_entry + [prev_entry[0]]
            result.extend(entry)
            if next_code < 4096:
                code_table[next_code] = entry
                next_code += 1
                if next_code == (1 << code_size) and code_size < 12:
                    code_size += 1

        prev_code = code

    return result


def deinterlace(indices, w, h):
    """Undo GIF interlacing."""
    rows = [indices[i*w:(i+1)*w] for i in range(h)]
    passes = [
        range(0, h, 8),
        range(4, h, 8),
        range(2, h, 4),
        range(1, h, 2),
    ]
    flat = []
    for pass_rows in passes:
        flat.extend(rows[r] for r in pass_rows)
    result = []
    dest_row = [None] * h
    src = 0
    for pass_rows in passes:
        for r in pass_rows:
            dest_row[r] = src
            src += 1
    out = [None] * h
    for dst, src_i in enumerate(dest_row):
        out[dst] = flat[src_i]
    return [px for row in out for px in row]


# ─────────────────────────────────────────────────────────────
# MINIMAL JPEG ENCODER
# ─────────────────────────────────────────────────────────────

def create_solid_jpeg(width, height, r, g, b, output_path):
    """
    Create a solid-color JPEG using baseline DCT encoding.
    Uses standard Huffman tables and quantization tables.
    """
    import struct

    # Convert RGB to YCbCr (JPEG range: Y 0-255, Cb/Cr 0-255 centered at 128)
    Y  = max(0, min(255, int( 0.299   * r + 0.587   * g + 0.114   * b)))
    Cb = max(0, min(255, int(-0.16874 * r - 0.33126 * g + 0.5     * b + 128)))
    Cr = max(0, min(255, int( 0.5     * r - 0.41869 * g - 0.08131 * b + 128)))

    # Standard quantization tables (quality ~85)
    lum_q = [
        16, 11, 10, 16, 24, 40, 51, 61,
        12, 12, 14, 19, 26, 58, 60, 55,
        14, 13, 16, 24, 40, 57, 69, 56,
        14, 17, 22, 29, 51, 87, 80, 62,
        18, 22, 37, 56, 68,109,103, 77,
        24, 35, 55, 64, 81,104,113, 92,
        49, 64, 78, 87,103,121,120,101,
        72, 92, 95, 98,112,100,103, 99
    ]
    chr_q = [
        17, 18, 24, 47, 99, 99, 99, 99,
        18, 21, 26, 66, 99, 99, 99, 99,
        24, 26, 56, 99, 99, 99, 99, 99,
        47, 66, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99, 99, 99
    ]

    # DC coefficient for solid-color block:
    # DCT of constant block: DC = 8 * (value - 128), all AC = 0
    y_dc  = round((Y  - 128) * 8 / lum_q[0])
    cb_dc = round((Cb - 128) * 8 / chr_q[0])
    cr_dc = round((Cr - 128) * 8 / chr_q[0])

    # Standard DC Huffman tables
    dc_lum_bits  = [0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0]
    dc_lum_vals  = [0,1,2,3,4,5,6,7,8,9,10,11]
    dc_chr_bits  = [0,3,1,1,1,1,1,1,1,1,1,0,0,0,0,0]
    dc_chr_vals  = [0,1,2,3,4,5,6,7,8,9,10,11]

    # Standard AC Huffman tables
    ac_lum_bits  = [0,2,1,3,3,2,4,3,5,5,4,4,0,0,1,125]
    ac_lum_vals  = [
        0x01,0x02,0x03,0x00,0x04,0x11,0x05,0x12,
        0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,
        0x22,0x71,0x14,0x32,0x81,0x91,0xa1,0x08,
        0x23,0x42,0xb1,0xc1,0x15,0x52,0xd1,0xf0,
        0x24,0x33,0x62,0x72,0x82,0x09,0x0a,0x16,
        0x17,0x18,0x19,0x1a,0x25,0x26,0x27,0x28,
        0x29,0x2a,0x34,0x35,0x36,0x37,0x38,0x39,
        0x3a,0x43,0x44,0x45,0x46,0x47,0x48,0x49,
        0x4a,0x53,0x54,0x55,0x56,0x57,0x58,0x59,
        0x5a,0x63,0x64,0x65,0x66,0x67,0x68,0x69,
        0x6a,0x73,0x74,0x75,0x76,0x77,0x78,0x79,
        0x7a,0x83,0x84,0x85,0x86,0x87,0x88,0x89,
        0x8a,0x92,0x93,0x94,0x95,0x96,0x97,0x98,
        0x99,0x9a,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,
        0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,0xb5,0xb6,
        0xb7,0xb8,0xb9,0xba,0xc2,0xc3,0xc4,0xc5,
        0xc6,0xc7,0xc8,0xc9,0xca,0xd2,0xd3,0xd4,
        0xd5,0xd6,0xd7,0xd8,0xd9,0xda,0xe1,0xe2,
        0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,0xea,
        0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
        0xf9,0xfa
    ]
    ac_chr_bits  = [0,2,1,2,4,4,3,4,7,5,4,4,0,1,2,119]
    ac_chr_vals  = [
        0x00,0x01,0x02,0x03,0x11,0x04,0x05,0x21,
        0x31,0x06,0x12,0x41,0x51,0x07,0x61,0x71,
        0x13,0x22,0x32,0x81,0x08,0x14,0x42,0x91,
        0xa1,0xb1,0xc1,0x09,0x23,0x33,0x52,0xf0,
        0x15,0x62,0x72,0xd1,0x0a,0x16,0x24,0x34,
        0xe1,0x25,0xf1,0x17,0x18,0x19,0x1a,0x26,
        0x27,0x28,0x29,0x2a,0x35,0x36,0x37,0x38,
        0x39,0x3a,0x43,0x44,0x45,0x46,0x47,0x48,
        0x49,0x4a,0x53,0x54,0x55,0x56,0x57,0x58,
        0x59,0x5a,0x63,0x64,0x65,0x66,0x67,0x68,
        0x69,0x6a,0x73,0x74,0x75,0x76,0x77,0x78,
        0x79,0x7a,0x82,0x83,0x84,0x85,0x86,0x87,
        0x88,0x89,0x8a,0x92,0x93,0x94,0x95,0x96,
        0x97,0x98,0x99,0x9a,0xa2,0xa3,0xa4,0xa5,
        0xa6,0xa7,0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,
        0xb5,0xb6,0xb7,0xb8,0xb9,0xba,0xc2,0xc3,
        0xc4,0xc5,0xc6,0xc7,0xc8,0xc9,0xca,0xd2,
        0xd3,0xd4,0xd5,0xd6,0xd7,0xd8,0xd9,0xda,
        0xe2,0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,
        0xea,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
        0xf9,0xfa
    ]

    def build_huff_codes(bits, vals):
        codes = {}
        code = 0
        vi = 0
        for length in range(1, 17):
            count = bits[length - 1]
            for _ in range(count):
                codes[vals[vi]] = (code, length)
                vi += 1
                code += 1
            code <<= 1
        return codes

    dc_lum = build_huff_codes(dc_lum_bits, dc_lum_vals)
    dc_chr = build_huff_codes(dc_chr_bits, dc_chr_vals)
    ac_lum = build_huff_codes(ac_lum_bits, ac_lum_vals)
    ac_chr = build_huff_codes(ac_chr_bits, ac_chr_vals)

    def make_dqt(tbl_id, tbl):
        body = bytes([tbl_id & 0xF]) + bytes(tbl)
        length = 2 + len(body)
        return b'\xff\xdb' + struct.pack('>H', length) + body

    def make_dht(acdc, tbl_id, bits_list, vals_list):
        body = bytes([(acdc << 4) | (tbl_id & 0xF)] + bits_list + vals_list)
        length = 2 + len(body)
        return b'\xff\xc4' + struct.pack('>H', length) + body

    # Bit stream encoder
    class BitStream:
        def __init__(self):
            self._data = bytearray()
            self._buf = 0
            self._bits = 0

        def write(self, code, length):
            for i in range(length - 1, -1, -1):
                self._buf = (self._buf << 1) | ((code >> i) & 1)
                self._bits += 1
                if self._bits == 8:
                    self._data.append(self._buf)
                    if self._buf == 0xFF:
                        self._data.append(0x00)  # byte stuffing
                    self._buf = 0
                    self._bits = 0

        def flush(self):
            if self._bits > 0:
                self._buf <<= (8 - self._bits)
                self._data.append(self._buf)
                if self._buf == 0xFF:
                    self._data.append(0x00)

        def getbytes(self):
            return bytes(self._data)

    def encode_dc(bs, diff, huff):
        size = 0
        v = abs(diff)
        while v > 0:
            size += 1
            v >>= 1
        code, length = huff[size]
        bs.write(code, length)
        if size > 0:
            amp = diff if diff > 0 else diff - 1
            bs.write(amp & ((1 << size) - 1), size)

    def encode_eob(bs, huff):
        code, length = huff[0x00]
        bs.write(code, length)

    out = bytearray()

    # SOI
    out += b'\xff\xd8'

    # APP0 JFIF
    out += b'\xff\xe0'
    out += struct.pack('>H', 16)
    out += b'JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00'

    # DQT
    out += make_dqt(0, lum_q)
    out += make_dqt(1, chr_q)

    # SOF0 (Baseline DCT, 3 components, 4:2:0 subsampling... use 4:4:4 for simplicity)
    sof_body = struct.pack('>BHHB', 8, height, width, 3)
    # Component 1 (Y):  id=1, sampling=1x1, qtable=0
    sof_body += bytes([1, 0x11, 0])
    # Component 2 (Cb): id=2, sampling=1x1, qtable=1
    sof_body += bytes([2, 0x11, 1])
    # Component 3 (Cr): id=3, sampling=1x1, qtable=1
    sof_body += bytes([3, 0x11, 1])
    out += b'\xff\xc0' + struct.pack('>H', 2 + len(sof_body)) + sof_body

    # DHT
    out += make_dht(0, 0, dc_lum_bits, dc_lum_vals)
    out += make_dht(0, 1, dc_chr_bits, dc_chr_vals)
    out += make_dht(1, 0, ac_lum_bits, ac_lum_vals)
    out += make_dht(1, 1, ac_chr_bits, ac_chr_vals)

    # SOS
    sos_body = bytes([3, 1, 0x00, 2, 0x11, 3, 0x11, 0, 0x3F, 0])
    out += b'\xff\xda' + struct.pack('>H', 2 + len(sos_body)) + sos_body

    # Entropy-coded data
    mcu_w = (width + 7) // 8
    mcu_h = (height + 7) // 8
    total_mcus = mcu_w * mcu_h

    bs = BitStream()
    prev_y = prev_cb = prev_cr = 0

    for _ in range(total_mcus):
        # Y component
        encode_dc(bs, y_dc - prev_y, dc_lum)
        prev_y = y_dc
        encode_eob(bs, ac_lum)

        # Cb component
        encode_dc(bs, cb_dc - prev_cb, dc_chr)
        prev_cb = cb_dc
        encode_eob(bs, ac_chr)

        # Cr component
        encode_dc(bs, cr_dc - prev_cr, dc_chr)
        prev_cr = cr_dc
        encode_eob(bs, ac_chr)

    bs.flush()
    out += bs.getbytes()

    # EOI
    out += b'\xff\xd9'

    with open(output_path, 'wb') as f:
        f.write(out)

    return len(out)


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

OUT = r'C:\Sites\toons\public\images'

print("=== Phase 05-02 Image Asset Creation ===\n")

# 1. toonami-aftermath.png — dark blue placeholder (256x256)
print("Creating toonami-aftermath.png (placeholder)...")
png = solid_color_png(256, 256, 0x1a, 0x1a, 0x2e)
path_out = os.path.join(OUT, 'toonami-aftermath.png')
with open(path_out, 'wb') as f:
    f.write(png)
print(f"  -> {len(png)} bytes")

# 2. swim-rewind.png — already downloaded as JPEG, needs to be kept as PNG
# The file downloaded as swim-rewind.png is actually a JPEG (ffd8ff magic).
# We need to convert it to PNG. Read its RGB data from JPEG - too complex.
# Use a solid color placeholder instead since it's a live stream thumbnail not a logo.
# Actually let's keep the JPEG but rename it properly.
# The channels.js uses BASE_URL + /public/images/swim-rewind.png
# Let's just create a solid-color placeholder.
print("Creating swim-rewind.png (placeholder - blue)...")
png = solid_color_png(256, 256, 0x00, 0x33, 0x66)
path_out = os.path.join(OUT, 'swim-rewind.png')
with open(path_out, 'wb') as f:
    f.write(png)
print(f"  -> {len(png)} bytes")

# 3. ccn.png — already downloaded (66KB PNG, valid, under 100KB) — resize to 256x256
print("Resizing ccn.png (66KB -> 256x256)...")
try:
    size = resize_png(
        os.path.join(OUT, 'ccn.png'),
        os.path.join(OUT, 'ccn.png'),
        256, 256
    )
except Exception as e:
    print(f"  ERROR resizing ccn.png: {e}")
    print("  Falling back to solid color placeholder...")
    png = solid_color_png(256, 256, 0x33, 0x33, 0x88)
    with open(os.path.join(OUT, 'ccn.png'), 'wb') as f:
        f.write(png)
    print(f"  -> {len(png)} bytes")

# 4. afterswim.png — convert GIF first frame to PNG
print("Converting afterswim GIF to PNG...")
gif_path = os.path.join(OUT, 'afterswim-orig.gif')
try:
    w, h, pixels = read_gif_frame0(gif_path)
    print(f"  GIF frame: {w}x{h}")
    # Resize to 256x256
    resized = resize_pixels(pixels, w, h, 256, 256)
    png = encode_png(256, 256, resized)
    with open(os.path.join(OUT, 'afterswim.png'), 'wb') as f:
        f.write(png)
    print(f"  -> 256x256, {len(png)} bytes")
except Exception as e:
    print(f"  ERROR: {e}")
    print("  Falling back to solid color placeholder...")
    png = solid_color_png(256, 256, 0x22, 0x11, 0x44)
    with open(os.path.join(OUT, 'afterswim.png'), 'wb') as f:
        f.write(png)
    print(f"  -> {len(png)} bytes")

# 5. verniy.png — resize oversized PNG (599KB -> 256x256)
print("Resizing verniy.png (599KB -> 256x256)...")
try:
    size = resize_png(
        os.path.join(OUT, 'verniy.png'),
        os.path.join(OUT, 'verniy.png'),
        256, 256
    )
except Exception as e:
    print(f"  ERROR resizing verniy.png: {e}")
    print("  Falling back to solid color placeholder...")
    png = solid_color_png(256, 256, 0x11, 0x22, 0x44)
    with open(os.path.join(OUT, 'verniy.png'), 'wb') as f:
        f.write(png)
    print(f"  -> {len(png)} bytes")

# 6. retrostrange.png — resize (114KB -> 256x256, should come under 100KB)
print("Resizing retrostrange.png (114KB -> 256x256)...")
try:
    size = resize_png(
        os.path.join(OUT, 'retrostrange.png'),
        os.path.join(OUT, 'retrostrange.png'),
        256, 256
    )
except Exception as e:
    print(f"  ERROR resizing retrostrange.png: {e}")
    print("  Falling back to solid color placeholder...")
    png = solid_color_png(256, 256, 0x33, 0x11, 0x11)
    with open(os.path.join(OUT, 'retrostrange.png'), 'wb') as f:
        f.write(png)
    print(f"  -> {len(png)} bytes")

# 7. addon-logo.png — dark monochrome 256x256
print("Creating addon-logo.png...")
png = solid_color_png(256, 256, 0x1a, 0x1a, 0x1a)
with open(os.path.join(OUT, 'addon-logo.png'), 'wb') as f:
    f.write(png)
print(f"  -> {len(png)} bytes")

# 8. addon-background.jpg — solid dark gradient JPEG 1024x786
print("Creating addon-background.jpg (JPEG, 1024x786)...")
try:
    jpeg_size = create_solid_jpeg(1024, 786, 0x0d, 0x0d, 0x26, os.path.join(OUT, 'addon-background.jpg'))
    print(f"  -> {jpeg_size} bytes")
except Exception as e:
    print(f"  ERROR creating JPEG: {e}")
    import traceback
    traceback.print_exc()

# Clean up temp file
gif_temp = os.path.join(OUT, 'afterswim-orig.gif')
if os.path.exists(gif_temp):
    os.remove(gif_temp)
    print("\nCleaned up afterswim-orig.gif")

print("\n=== Final file check ===")
required = ['toonami-aftermath.png','swim-rewind.png','ccn.png','afterswim.png',
            'verniy.png','retrostrange.png','addon-logo.png','addon-background.jpg']
all_ok = True
for fname in required:
    fpath = os.path.join(OUT, fname)
    if os.path.exists(fpath):
        sz = os.path.getsize(fpath)
        over = sz > 102400 and fname.endswith('.png') and 'background' not in fname
        status = "OVER 100KB" if over else "OK"
        print(f"  {fname}: {sz:,} bytes ({sz/1024:.1f} KB) {status}")
        if over or sz == 0:
            all_ok = False
    else:
        print(f"  {fname}: MISSING")
        all_ok = False

print(f"\n{'All files OK' if all_ok else 'SOME FILES NEED ATTENTION'}")
