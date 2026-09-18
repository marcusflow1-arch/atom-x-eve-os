# Blender + Atom X Eve Pipeline

## Connection architecture

```
ChatGPT / Codex / MCP client
        |
        | MCP
        v
Blender MCP server
        |
        | local TCP
        v
Blender MCP add-on
        |
        v
Blender bpy scene
```

Use a Blender MCP implementation that exposes Blender's Python API to the MCP client.

Recommended environment:
- Blender 4.2 LTS or newer
- Python 3.10+
- local-only MCP socket
- do not expose the Blender bridge port to the public internet

## One-time local setup

1. Install Blender.
2. Install a Blender MCP server/add-on.
3. Start its local bridge inside Blender.
4. Add the MCP server to the MCP-capable client used for production.
5. Open the Atom X Eve asset file.
6. Run the asset-prep script from this folder or let the MCP agent invoke the same operations through `bpy`.

Example MCP client configuration:

```json
{
  "mcpServers": {
    "blender": {
      "command": "mcp-blender",
      "args": ["--port", "9876"]
    }
  }
}
```

The exact command depends on the Blender MCP implementation installed on the workstation.

## What Blender does in this pipeline

Tripo:
- generates
- rig-checks
- rigs
- retargets

Blender:
- inspects
- corrects
- bakes
- optimizes
- creates LOD/collision assets
- validates
- exports

## Character import checklist

- scale is correct
- forward direction is correct
- origin is sane
- armature exists
- deform bones exist
- weights are normalized
- no unweighted vertices
- no non-manifold surprises
- texture paths are valid
- material count is reasonable
- animation loops cleanly

## Export

Web/runtime preview:
- GLB

Engine/source exchange:
- FBX when required

Keep the source .blend file for any manually corrected hero character.
