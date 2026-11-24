"""Lê o GLB do modelo e devolve, por malha, as posições dos vértices em
coordenadas do mundo. Decodifica o codec de atributos do meshopt (versão 0)
em Python puro — só posições, que é o que os acidentes ósseos precisam.

Uso como módulo: load(glb_path) -> list[dict(name, key, layer, side, pos=np.ndarray Nx3)]
"""
import json
import re
import struct
import sys

import numpy as np


def unzigzag(v):
    return (-(v & 1) ^ (v >> 1)) & 0xFF


def decode_bytes_group(data, pos, bitslog2):
    if bitslog2 == 0:
        return [0] * 16, pos
    if bitslog2 == 3:
        return list(data[pos:pos + 16]), pos + 16
    bits = 2 if bitslog2 == 1 else 4
    per_byte = 8 // bits
    head = 16 // per_byte
    var = pos + head
    out = []
    mask = (1 << bits) - 1
    for i in range(16):
        byte = data[pos + i // per_byte]
        shift = 8 - bits * (i % per_byte + 1)
        enc = (byte >> shift) & mask
        if enc == mask:
            out.append(data[var])
            var += 1
        else:
            out.append(enc)
    return out, var


def decode_bytes(data, pos, size):
    groups = size // 16
    header_size = (groups + 3) // 4
    header = pos
    pos += header_size
    out = []
    for g in range(groups):
        bitslog2 = (data[header + g // 4] >> ((g % 4) * 2)) & 3
        vals, pos = decode_bytes_group(data, pos, bitslog2)
        out.extend(vals)
    return out, pos


def decode_vertex_buffer(data, count, stride):
    assert data[0] & 0xF0 == 0xA0, "cabeçalho de vértices inesperado"
    assert data[0] & 0x0F == 0, "versão do codec não suportada"
    last = list(data[len(data) - stride:])
    block = min((8192 // stride) & ~15, 256)
    out = bytearray(count * stride)
    pos = 1
    offset = 0
    while offset < count:
        n = min(block, count - offset)
        aligned = (n + 15) & ~15
        for k in range(stride):
            vals, pos = decode_bytes(data, pos, aligned)
            p = last[k]
            for i in range(n):
                p = (unzigzag(vals[i]) + p) & 0xFF
                out[(offset + i) * stride + k] = p
            last[k] = p
        offset += n
    tail = max(stride, 32)
    assert len(data) - pos == tail, f"sobra inesperada: {len(data) - pos} != {tail}"
    return bytes(out)


def node_matrix(n):
    if "matrix" in n:
        return np.array(n["matrix"], dtype=float).reshape(4, 4).T
    t = np.array(n.get("translation", [0, 0, 0]), dtype=float)
    q = n.get("rotation", [0, 0, 0, 1])
    s = np.array(n.get("scale", [1, 1, 1]), dtype=float)
    x, y, z, w = q
    r = np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ])
    m = np.eye(4)
    m[:3, :3] = r * s
    m[:3, 3] = t
    return m


def mesh_key(name):
    return re.sub(r"\s+", " ", re.sub(r"\b(left|right)\b", " ", name, flags=re.I)).strip().lower()


def load(path, layers=None):
    b = open(path, "rb").read()
    jlen = struct.unpack("<I", b[12:16])[0]
    g = json.loads(b[20:20 + jlen])
    bin_start = 20 + jlen + 8
    binchunk = b[bin_start:]

    world = {}

    def walk(idx, parent):
        m = parent @ node_matrix(g["nodes"][idx])
        world[idx] = m
        for c in g["nodes"][idx].get("children", []):
            walk(c, m)

    for root in g["scenes"][g.get("scene", 0)]["nodes"]:
        walk(root, np.eye(4))

    out = []
    for idx, n in enumerate(g["nodes"]):
        ex = n.get("extras") or {}
        if "mesh" not in n or "name" not in ex:
            continue
        if layers and ex.get("layer") not in layers:
            continue
        prim = g["meshes"][n["mesh"]]["primitives"][0]
        acc = g["accessors"][prim["attributes"]["POSITION"]]
        bv = g["bufferViews"][acc["bufferView"]]
        ext = bv["extensions"]["EXT_meshopt_compression"]
        assert g["buffers"][ext["buffer"]].get("byteLength") and ext["mode"] == "ATTRIBUTES"
        comp = binchunk[ext["byteOffset"]:ext["byteOffset"] + ext["byteLength"]]
        raw = decode_vertex_buffer(comp, ext["count"], ext["byteStride"])
        assert acc["componentType"] == 5122, acc["componentType"]
        arr = np.frombuffer(raw, dtype="<i2").reshape(ext["count"], ext["byteStride"] // 2)[:, :3]
        arr = arr.astype(float)
        if acc.get("normalized"):
            arr = np.maximum(arr / 32767.0, -1.0)
        # Confere com o min/max declarados (antes de transformar).
        assert np.all(arr.min(0) >= np.array(acc["min"]) - 1e-6), (ex["name"], arr.min(0), acc["min"])
        assert np.all(arr.max(0) <= np.array(acc["max"]) + 1e-6), (ex["name"], arr.max(0), acc["max"])
        assert np.allclose(arr.min(0), acc["min"]) and np.allclose(arr.max(0), acc["max"]), ex["name"]
        m = world[idx]
        pos = (np.c_[arr, np.ones(len(arr))] @ m.T)[:, :3]
        out.append({"name": ex["name"], "key": mesh_key(ex["name"]), "layer": ex.get("layer"),
                    "side": ex.get("side"), "pos": pos})
    return out


if __name__ == "__main__":
    meshes = load(sys.argv[1], {"skeleton"})
    allp = np.vstack([m["pos"] for m in meshes])
    print(len(meshes), "malhas de esqueleto,", len(allp), "vértices")
    print("caixa do esqueleto:", allp.min(0).round(3), allp.max(0).round(3))
    for m in meshes[:3]:
        print(m["name"], m["side"], len(m["pos"]), m["pos"].min(0).round(3), m["pos"].max(0).round(3))
