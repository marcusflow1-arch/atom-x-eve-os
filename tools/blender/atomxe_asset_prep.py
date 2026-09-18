"""Atom X Eve Blender asset preparation helper.

Run inside Blender:
    blender --background --python atomxe_asset_prep.py -- --input model.glb --output model_game.glb

This script intentionally handles deterministic cleanup/validation. Character
auto-rig and animation retarget are handled upstream by Tripo, then inspected
and corrected in Blender.
"""

import argparse
import json
import os
import sys
import bpy
from mathutils import Vector


def args_after_double_dash():
    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1:]


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--mode", choices=["character", "prop", "environment"], default="character")
    parser.add_argument("--target-height", type=float, default=1.8)
    parser.add_argument("--apply-transforms", action="store_true")
    return parser.parse_args(args_after_double_dash())


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def import_asset(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in {".glb", ".gltf"}:
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=False)
    else:
        raise ValueError(f"Unsupported input format: {ext}")


def mesh_objects():
    return [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]


def armatures():
    return [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]


def world_bounds(objects):
    if not objects:
        return None
    points = []
    for obj in objects:
        for corner in obj.bound_box:
            points.append(obj.matrix_world @ Vector(corner))
    mins = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maxs = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return mins, maxs


def normalize_character_height(target_height):
    meshes = mesh_objects()
    bounds = world_bounds(meshes)
    if not bounds:
        return
    mins, maxs = bounds
    height = maxs.z - mins.z
    if height <= 0:
        return
    factor = target_height / height
    roots = [obj for obj in bpy.context.scene.objects if obj.parent is None]
    for obj in roots:
        obj.scale *= factor
    bpy.context.view_layer.update()


def apply_transforms_to_roots():
    for obj in bpy.context.scene.objects:
        obj.select_set(False)
    roots = [obj for obj in bpy.context.scene.objects if obj.parent is None]
    for obj in roots:
        obj.select_set(True)
    if roots:
        bpy.context.view_layer.objects.active = roots[0]
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


def validate(mode):
    meshes = mesh_objects()
    rigs = armatures()
    warnings = []

    if not meshes:
        warnings.append("No mesh objects found.")

    if mode == "character":
        if not rigs:
            warnings.append("No armature found.")
        else:
            deform_bones = [
                bone
                for rig in rigs
                for bone in rig.data.bones
                if bone.use_deform
            ]
            if not deform_bones:
                warnings.append("Armature has no deform bones.")

        for mesh in meshes:
            if not mesh.vertex_groups and rigs:
                warnings.append(f"{mesh.name}: no vertex groups / skin weights.")

    material_slots = sum(len(mesh.material_slots) for mesh in meshes)
    triangles = 0
    for mesh in meshes:
        depsgraph = bpy.context.evaluated_depsgraph_get()
        evaluated = mesh.evaluated_get(depsgraph)
        temp = evaluated.to_mesh()
        temp.calc_loop_triangles()
        triangles += len(temp.loop_triangles)
        evaluated.to_mesh_clear()

    return {
        "mode": mode,
        "mesh_count": len(meshes),
        "armature_count": len(rigs),
        "material_slots": material_slots,
        "triangles": triangles,
        "warnings": warnings,
    }


def export_glb(path):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_apply=True,
        export_animations=True,
        export_yup=True,
    )


def main():
    args = parse_args()
    clear_scene()
    import_asset(args.input)

    if args.mode == "character":
        normalize_character_height(args.target_height)

    if args.apply_transforms:
        apply_transforms_to_roots()

    report = validate(args.mode)
    print("ATOMXE_ASSET_REPORT=" + json.dumps(report, sort_keys=True))

    export_glb(args.output)


if __name__ == "__main__":
    main()
