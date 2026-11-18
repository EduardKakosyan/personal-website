"""Small modelling helpers for the cabin scene.

Every object is built from simple parts (boxes, cones, spheres, wedges) so the
whole scene stays low-poly and can be rebuilt from scratch by running
build_arrival.py. Units are metres; Blender is Z-up and characters face -Y.
"""

import math

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

# Palette: the "bit brighter" row sampled from Eduard's photos (A37),
# plus a few neutrals the photos don't cover (trim, gravel, skin, denim).
PALETTE = {
    "grass": "#4f7739",
    "grass_light": "#6f9a45",
    "grass_dark": "#3f6430",
    "spruce": "#356a48",
    "spruce_light": "#4c8a50",
    "spruce_sun": "#638563",
    "blue_spruce": "#4f7f8a",
    # inside the cabin (photo 08, finished as A19 asks)
    "pine": "#e3c08d",
    "pine_dark": "#b98d5c",
    "floor_red": "#8e4a36",
    "floor_dark": "#6e3626",
    "rug_cream": "#efe2c4",
    "rug_red": "#cf8a78",
    "rug_green": "#a3b483",
    "bistro_red": "#b8352f",
    "paper": "#fbf6ea",
    "ink": "#3b2a1e",
    "blue_spruce_light": "#7aa3aa",
    "moss": "#a9a933",
    "lupine": "#6b46a8",
    "lupine_pink": "#c56aa8",
    "sky": "#5f95c5",
    "cabin": "#9a6439",
    "cabin_dark": "#6e4426",
    "trim": "#f2ece0",
    "roof": "#8f98a0",
    "roof_dark": "#6f7880",
    "door": "#2c3036",
    "glass": "#a9cfe0",
    "gravel": "#b8ae9c",
    "gravel_dark": "#958b7b",
    "lumber": "#dcb57e",
    "deck": "#b98a57",
    "weathered": "#8d7d69",
    "bark": "#6b4a2e",
    "endgrain": "#e2c48f",
    "stone": "#9a978f",
    "steel": "#c9ccd2",
    "metal_dark": "#3a3f47",
    "blue_sink": "#2a4fa3",
    "water_jug": "#7cc0e8",
    "panel": "#d9dde0",
    "string_light": "#fec54f",
    "wire": "#2a2a2a",
    "birch": "#ecebe4",
    "birch_leaf": "#86b44c",
    # characters
    "skin": "#d9a77f",
    "skin_guest": "#e6b98f",
    "hair": "#1d1a19",
    "tee_red": "#c0392f",
    "denim": "#35507e",
    "boot": "#4a3426",
    "jacket": "#d49a2c",
    "pack": "#2f6e6a",
    "beanie": "#2a4fa3",
    "khaki": "#8a7a5a",
    "hair_brown": "#5a3a24",
    "rusty": "#d4a85c",
    "rusty_dark": "#c3954e",
    "rusty_muzzle": "#e6d3a8",
    # Rusty, remodelled from photo 05 (A105): cream chest, belly and legs, the
    # greying face, a deeper gold along his back, the liver nose, brown eyes
    "rusty_light": "#ecd3a0",
    "rusty_face": "#e9d8b2",
    "rusty_toes": "#f3ead6",
    "rusty_saddle": "#c99b55",
    "rusty_nose": "#7a4e45",
    "rusty_eye": "#3a2316",
    "eye_shine": "#fffaf0",
    "mouth": "#4a2328",
    "pad": "#57433f",
    # Eduard, remodelled (A107): the inside of his ears, his belt, boot soles
    "skin_shade": "#c48f69",
    "belt": "#3b2a20",
    "sole": "#2a221d",
    "collar": "#e0702a",
    "nose": "#1d1a19",
    "tongue": "#e07d8c",
    "cow_white": "#f4f1ea",
    "cow_black": "#1f1d1c",
    "cow_snout": "#b9b9bd",
    "hugo_white": "#f3f1ec",
    "hugo_eye": "#141618",
    "hugo_lens": "#2b3a4a",
    "hugo_base": "#2b2f36",
    "rod": "#9aa0a8",
    "hammer_head": "#5d636b",
    # added for the full property (v2)
    "road": "#a99c86",
    "solar": "#26385e",
    "solar_frame": "#b9bec4",
    "water": "#3f7f8f",
    "water_light": "#8cc7c9",
    "bank": "#8a7358",
    "alder": "#5c8a3a",
    "daisy": "#f6f1e2",
    "yolk": "#f2c43b",
    "fire_ring": "#5b5651",
    "char": "#2a2624",
    "lip": "#9a4a3c",
    "eye_brown": "#3b2416",
    "white_sink": "#ecebe6",
    "tote_green": "#3f6b4a",
    "kettle": "#1f2124",
    # the mushroom basket in the cabin (A70)
    "wicker": "#c4975a",
    "wicker_dark": "#8f6537",
    "chanterelle": "#f0a530",
    "chanterelle_light": "#f7c24e",
    "bolete_cap": "#8a5530",
    "bolete_stem": "#eadfc4",
    # the woodshed (photo 07): fresh pale lumber, split firewood
    "shed": "#dab680",
    "shed_post": "#c49a62",
    "shed_shadow": "#7a5a3a",
    "split_wood": "#cfa56b",
    # the outdoor shower's corrugated sheets (photo 05): white with grey ribs
    "panel_rib": "#b9c0c6",
}

# Faces meeting at less than this angle are shaded smoothly (spheres, 7-sided cones).
SMOOTH_ANGLE = 60

_materials = {}
_current = {"collection": None}


def hex_to_linear(h):
    h = h.lstrip("#")
    srgb = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, 1.0)


def mat(name, emission=0.0):
    key = (name, emission)
    if key in _materials:
        return _materials[key]
    m = bpy.data.materials.new(name if not emission else f"{name}_glow")
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    color = hex_to_linear(PALETTE[name])
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = 0.9
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.2
    if emission:
        bsdf.inputs["Emission Color"].default_value = color
        bsdf.inputs["Emission Strength"].default_value = emission
    m.diffuse_color = color
    _materials[key] = m
    return m


def reset_scene():
    """Start from an empty scene.

    Headless runs reset to factory settings. Inside a running Blender (through the
    MCP) that would also switch off the MCP add-on, so there we delete everything
    by hand instead.
    """
    _materials.clear()
    if bpy.app.background:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        return
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for blocks in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras, bpy.data.worlds, bpy.data.images):
        for b in list(blocks):
            if b.users == 0 or blocks is not bpy.data.worlds:
                blocks.remove(b)


def collection(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(c)
    _current["collection"] = c
    return c


def _link(ob):
    _current["collection"].objects.link(ob)


def empty(name, location=(0, 0, 0), parent=None):
    ob = bpy.data.objects.new(name, None)
    ob.empty_display_size = 0.2
    _link(ob)
    if parent:
        ob.parent = parent
    ob.location = location
    return ob


def _matrix(center, rot, scale):
    return (
        Matrix.Translation(Vector(center))
        @ Euler(rot).to_matrix().to_4x4()
        @ Matrix.Diagonal((*scale, 1.0))
    )


def _new_faces(bm, before):
    return [f for f in bm.faces if f not in before]


class Part:
    """One primitive inside a compound mesh. Coordinates are relative to the object's pivot."""

    def __init__(self, kind, mat_name, center=(0, 0, 0), rot=(0, 0, 0), **kw):
        self.kind = kind
        self.mat_name = mat_name
        self.center = center
        self.rot = rot
        self.kw = kw


def box(mat_name, size, center=(0, 0, 0), rot=(0, 0, 0)):
    return Part("box", mat_name, center, rot, size=size)


def cyl(mat_name, r, depth, center=(0, 0, 0), rot=(0, 0, 0), r2=None, seg=8, caps=None, scale=(1, 1, 1)):
    return Part("cyl", mat_name, center, rot, r=r, r2=r if r2 is None else r2, depth=depth, seg=seg, caps=caps, scale=scale)


def sphere(mat_name, r, center=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), seg=8, rings=6):
    return Part("sphere", mat_name, center, rot, r=r, scale=scale, seg=seg, rings=rings)


def ico(mat_name, r, center=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), sub=1):
    return Part("ico", mat_name, center, rot, r=r, scale=scale, sub=sub)


def wedge(mat_name, width, depth, height, center=(0, 0, 0), rot=(0, 0, 0)):
    """Triangular prism: base `width` along X, extruded `depth` along Y, peak `height` up Z."""
    return Part("wedge", mat_name, center, rot, width=width, depth=depth, height=height)


def half_log(mat_name, r, length, center=(0, 0, 0), rot=(0, 0, 0), seg=7, caps=None, flat=None):
    """Half a log, split lengthwise. The log runs along Z, the flat split face
    is the plane y = 0 and the round half bulges towards -Y. `caps` is the
    end-grain material, `flat` the pale split face."""
    return Part("half_log", mat_name, center, rot, r=r, length=length, seg=seg, caps=caps, flat=flat)


def compound(name, parts, location=(0, 0, 0), parent=None, rot=(0, 0, 0), bevel=0.0, bevel_segments=1):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    slots = []

    def slot(mat_name):
        if mat_name not in slots:
            slots.append(mat_name)
        return slots.index(mat_name)

    for p in parts:
        before = set(bm.faces)
        mi = slot(p.mat_name)
        if p.kind == "box":
            m = _matrix(p.center, p.rot, p.kw["size"])
            bmesh.ops.create_cube(bm, size=1.0, matrix=m)
        elif p.kind == "cyl":
            m = _matrix(p.center, p.rot, p.kw.get("scale", (1, 1, 1)))
            bmesh.ops.create_cone(
                bm,
                cap_ends=True,
                segments=p.kw["seg"],
                radius1=p.kw["r"],
                radius2=p.kw["r2"],
                depth=p.kw["depth"],
                matrix=m,
            )
        elif p.kind == "sphere":
            m = _matrix(p.center, p.rot, p.kw["scale"])
            bmesh.ops.create_uvsphere(
                bm, u_segments=p.kw["seg"], v_segments=p.kw["rings"], radius=p.kw["r"], matrix=m
            )
        elif p.kind == "ico":
            m = _matrix(p.center, p.rot, p.kw["scale"])
            bmesh.ops.create_icosphere(bm, subdivisions=p.kw["sub"], radius=p.kw["r"], matrix=m)
        elif p.kind == "wedge":
            w, d, h = p.kw["width"], p.kw["depth"], p.kw["height"]
            m = _matrix(p.center, p.rot, (1, 1, 1))
            pts = [(-w / 2, -d / 2, 0), (w / 2, -d / 2, 0), (0, -d / 2, h), (-w / 2, d / 2, 0), (w / 2, d / 2, 0), (0, d / 2, h)]
            vs = [bm.verts.new(m @ Vector(c)) for c in pts]
            bm.faces.new((vs[0], vs[1], vs[2]))
            bm.faces.new((vs[5], vs[4], vs[3]))
            bm.faces.new((vs[0], vs[3], vs[4], vs[1]))
            bm.faces.new((vs[1], vs[4], vs[5], vs[2]))
            bm.faces.new((vs[2], vs[5], vs[3], vs[0]))
        elif p.kind == "half_log":
            m = _matrix(p.center, p.rot, (1, 1, 1))
            r, ln, n = p.kw["r"], p.kw["length"], p.kw["seg"]
            # a half-disc (the chord along X at y = 0, the arc bulging to -Y), extruded along Z
            ring = [(r * math.cos(math.pi * k / n), -r * math.sin(math.pi * k / n)) for k in range(n + 1)]
            bottom = [bm.verts.new(m @ Vector((x, y, -ln / 2))) for x, y in ring]
            top = [bm.verts.new(m @ Vector((x, y, ln / 2))) for x, y in ring]
            bm.faces.new(tuple(reversed(bottom)))
            bm.faces.new(tuple(top))
            for k in range(n):
                bm.faces.new((bottom[k], bottom[k + 1], top[k + 1], top[k]))
            flat_face = bm.faces.new((bottom[-1], bottom[0], top[0], top[-1]))
            flat_face.tag = True
        new = _new_faces(bm, before)
        caps = p.kw.get("caps")
        axis = Euler(p.rot).to_matrix() @ Vector((0, 0, 1))
        caps_mi = slot(caps) if caps else None
        flat_mi = slot(p.kw["flat"]) if p.kw.get("flat") else None
        for f in new:
            f.material_index = mi
            if caps_mi is not None:
                f.normal_update()
                if abs(f.normal.dot(axis)) > 0.9:
                    f.material_index = caps_mi
            if flat_mi is not None and f.tag:
                f.material_index = flat_mi
                f.tag = False

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    # Round shapes (spheres, cones, logs) shade smoothly; boxes keep crisp edges.
    for poly in me.polygons:
        poly.use_smooth = True
    me.set_sharp_from_angle(angle=math.radians(SMOOTH_ANGLE))
    for s in slots:
        # "string_light@3" means the palette colour, glowing at strength 3.
        base, _, strength = s.partition("@")
        me.materials.append(mat(base, emission=float(strength)) if strength else mat(base))
    ob = bpy.data.objects.new(name, me)
    _link(ob)
    if parent:
        ob.parent = parent
    ob.location = location
    ob.rotation_euler = rot
    if bevel:
        mod = ob.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = bevel_segments
        mod.limit_method = "ANGLE"
        mod.angle_limit = math.radians(40)
        mod.harden_normals = False
    return ob


def glow(name, strength):
    """Material with emission, for the string-light bulbs."""
    return mat(name, emission=strength)


def deg(*a):
    return tuple(math.radians(x) for x in a)
