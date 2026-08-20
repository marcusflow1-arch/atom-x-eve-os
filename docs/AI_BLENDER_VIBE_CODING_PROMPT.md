# Atom XE — AI Blender Vibe-Coding Integration Prompt

## Purpose

Build a seamless AI-agent workflow inside Atom XE that lets a user describe a 3D model in natural language or by voice, then have an AI agent generate and execute Blender Python in the user's locally installed Blender application to create the model.

The user must already have Blender installed on their computer. Do **not** bundle, download, install, or redistribute Blender. The goal is to make Blender feel like a native local capability of Atom XE while keeping the existing Atom XE web application architecture intact.

## Core User Experience

The user should be able to:

1. Open an **AI 3D / Blender** workspace in Atom XE.
2. Type or voice-input a request such as:
   - "Create a low-poly medieval sword with a leather-wrapped handle."
   - "Make a stylized sci-fi drone with four rotors and a cockpit."
   - "Create a humanoid robot with armor plates, a backpack, and articulated joints."
3. Submit the request.
4. Atom XE sends the request to the AI agent.
5. The AI agent determines the appropriate Blender operations and produces safe Blender Python code.
6. A local Blender bridge sends the generated job to the user's running Blender installation.
7. Blender executes the job and creates/updates the model in the current Blender scene.
8. Atom XE receives progress/status information and displays it to the user.
9. The user can request revisions conversationally, for example:
   - "Make the shoulders larger."
   - "Give it two more armor plates."
   - "Make the wheels thicker."
   - "Change the material to brushed metal."
10. The user can save/export the resulting asset for use in their project.

The experience should feel like **vibe coding for 3D modeling**: the user describes the desired result rather than manually operating Blender for every modeling step.

## Important Architecture Requirement

Do not attempt to make a browser-only web application directly control arbitrary local Blender installations. Browsers cannot safely and reliably launch or control a user's local Blender process by themselves.

Instead, implement a small **local Blender Bridge** that runs on the user's computer and communicates with Atom XE through a secure local connection.

Recommended architecture:

```text
User voice/text
      |
      v
Atom XE UI
      |
      v
AI 3D Agent
      |
      | generates structured Blender job + Blender Python
      v
Secure Local Blender Bridge
      |
      v
User's installed Blender
      |
      v
Generated / modified 3D asset
```

The local bridge is the connection between the cloud/web application and the locally installed Blender application.

## Blender Installation Requirement

Blender is a prerequisite supplied by the user.

The implementation may include a lightweight connection/status check, but it must not attempt to install Blender automatically.

The UI should clearly communicate states such as:

- **Blender Connected**
- **Blender Not Connected**
- **Blender Running — Ready**
- **Waiting for Blender**
- **Job Running**
- **Job Complete**
- **Job Failed**

If Blender is not available, provide clear instructions for starting Blender and enabling the Atom XE Blender bridge/add-on.

Do not require the user to manually copy Python scripts into Blender for normal operation.

## Recommended Local Bridge Design

Create a Blender add-on that exposes a localhost-only bridge/API inside Blender.

The add-on should:

- Start a local communication endpoint when Blender is running.
- Accept authenticated jobs from the Atom XE local bridge/client.
- Validate incoming job structure.
- Execute approved Blender Python operations inside Blender's main thread using Blender's supported Python APIs/timers where appropriate.
- Return structured status/results.
- Never execute arbitrary commands from untrusted network sources.
- Keep the default listener bound to localhost rather than publicly exposed network interfaces.
- Include a per-installation secret/token or equivalent local authentication mechanism.
- Provide a simple Blender UI panel showing connection status and recent jobs.

Prefer a structured command/job protocol over sending completely unrestricted Python whenever practical. The AI may generate Blender Python internally, but the bridge should still validate the job envelope and enforce reasonable limits.

## AI Agent Responsibilities

The AI 3D agent should:

1. Understand the user's natural-language request.
2. Determine whether the request is a creation, modification, material, scene, camera, lighting, export, or inspection operation.
3. Inspect available scene context when the bridge provides it.
4. Generate Blender Python appropriate for the installed Blender version.
5. Prefer deterministic, repeatable operations.
6. Use named collections and predictable object names.
7. Avoid destructive operations unless explicitly requested.
8. Preserve unrelated objects in the scene.
9. Explain what it is about to do for complex jobs.
10. Return concise progress updates.
11. Detect and recover from common Blender script errors when possible.
12. Support iterative conversational edits instead of starting from scratch every time.

## Modeling Strategy

The system should support two complementary modeling approaches:

### Procedural / Blender-native generation

For many objects, the AI should generate the asset directly with Blender Python using:

- Primitive meshes
- Modifiers
- Bevels
- Boolean operations
- Curves
- Geometry Nodes where appropriate
- Materials
- UV operations where appropriate
- Armatures when needed
- Collections and naming conventions

This provides fast, deterministic generation and is especially useful for hard-surface, stylized, low-poly, environment, prop, and kit-based assets.

### External AI 3D generation

Design the architecture so an external 3D-generation provider such as Tripo can be added later without redesigning the Atom XE ↔ Blender connection.

For example:

```text
Natural-language request
        |
        +----> Blender procedural generation
        |
        +----> External AI 3D provider
                       |
                       v
                 Generated mesh
                       |
                       v
                    Blender
```

Do not make Tripo a hard dependency for the first implementation unless the existing project already has a supported Tripo integration.

## Voice Input

Reuse Atom XE's existing voice-input capabilities if present.

If voice input is not already available, implement the 3D workspace so that it accepts a normal text prompt first and exposes a clean interface for speech-to-text integration.

The AI agent should receive the final transcribed request exactly as it would receive typed text.

## UI Requirements

Add a dedicated **AI 3D / Blender** experience that fits the existing Atom XE design system.

Include:

- Prompt input
- Microphone/voice input control when supported
- Generate button
- Blender connection indicator
- Job progress indicator
- Current operation/status
- Conversation/history of 3D instructions
- Cancel job control where safely possible
- Preview/result information
- Export/save controls
- Error messages that are understandable to non-programmers

Example:

```text
AI 3D BUILDER

Blender: ● Connected

What do you want to create?
[ Create a futuristic armored motorcycle...          ]

[ 🎙 Voice ]                         [ Generate ]

Status: Generating Blender scene...

✓ Geometry created
✓ Materials created
✓ Scene organized

[ Open/Focus in Blender ]   [ Export Asset ]
```

## Asset Handling

Use predictable project folders/collections for generated assets.

For example:

```text
assets/
  generated-3d/
    <asset-id>/
      source/
      exports/
      metadata.json
```

Blender-side collections should similarly use an Atom XE namespace, such as:

```text
ATOM_XE_GENERATED
```

Each generated asset should have metadata containing at minimum:

- Asset ID
- User prompt
- Creation timestamp
- Generator/agent version
- Blender version
- Object names
- Export paths when applicable
- Job ID

## Security Requirements

This feature must be designed as a local-control system, not an open remote-code-execution service.

Requirements:

- Bind local bridge services to localhost by default.
- Authenticate requests between Atom XE's local component and Blender.
- Never expose the Blender execution endpoint directly to the public internet.
- Validate request schemas.
- Add maximum script/job sizes.
- Add job timeouts.
- Log job IDs and results without logging secrets.
- Never place API keys in client-side source code.
- Keep provider secrets in secure server-side configuration where applicable.
- Clearly distinguish AI-generated code from trusted application code.
- Require explicit confirmation for destructive scene operations such as deleting large portions of a scene or overwriting existing assets.

## Project Integration

Before changing code:

1. Inspect the existing Atom XE repository structure.
2. Identify the current frontend architecture, routing, state management, backend/server functions, authentication, and existing AI functionality.
3. Reuse existing components, styles, utilities, and API patterns instead of creating parallel systems.
4. Determine where a local bridge installer/package or desktop companion can fit the existing architecture.
5. Do not replace existing Atom XE functionality.
6. Keep the feature modular so it can be disabled without breaking the application.

The current application is a Base44/Vite/React project. Preserve the existing dependency and build conventions unless there is a strong technical reason to change them.

## Suggested Repository Structure

Adapt these paths to the actual repository rather than blindly creating duplicates:

```text
src/
  features/
    ai3d/
      components/
      hooks/
      services/
      types/

blender/
  addon/
    atom_xe_bridge.py
    README.md

local-bridge/
  README.md
  src/
  package.json

docs/
  AI_BLENDER_VIBE_CODING_PROMPT.md
```

If the repository already has a better architecture, follow the existing architecture instead.

## Communication Protocol

Define a versioned job protocol similar to:

```json
{
  "version": 1,
  "jobId": "uuid",
  "type": "blender.generate",
  "prompt": "Create a futuristic armored motorcycle",
  "script": "...generated Blender Python...",
  "options": {
    "saveBlend": true,
    "exportFormat": "glb"
  }
}
```

The response should use structured messages such as:

```json
{
  "version": 1,
  "jobId": "uuid",
  "status": "completed",
  "message": "Model created successfully",
  "objects": ["ATOM_XE_Motorcycle"],
  "files": []
}
```

Also support progress events:

```json
{
  "jobId": "uuid",
  "status": "progress",
  "stage": "materials",
  "percent": 65,
  "message": "Applying materials"
}
```

## Error Handling

Errors should be returned in structured form and shown in user-friendly language.

Example:

```json
{
  "jobId": "uuid",
  "status": "error",
  "code": "BLENDER_NOT_CONNECTED",
  "message": "Blender is not connected. Start Blender and enable the Atom XE bridge add-on."
}
```

The UI should not expose raw stack traces by default, but developers should be able to access diagnostic logs.

## MVP Acceptance Criteria

The first working implementation is complete when all of the following are true:

- A user can open the AI 3D workspace in Atom XE.
- A user can enter a natural-language modeling request.
- Atom XE can submit the request to the AI 3D agent.
- The agent can produce a Blender job/script.
- A locally installed Blender can connect through the bridge.
- The job can be sent from Atom XE to the local Blender installation.
- Blender executes the job and creates a real 3D object.
- The UI receives progress and completion status.
- The user can issue a follow-up modification request.
- The follow-up modifies the existing generated object rather than blindly creating an unrelated duplicate.
- The user can save/export the result.
- Blender is never bundled or automatically installed.
- The bridge is localhost-only by default and authenticated.
- Existing Atom XE functionality continues to work.

## Example End-to-End Scenario

User says:

> "Create a stylized futuristic combat robot, about twice the height of a human, with broad shoulders, two arm-mounted weapons, heavy legs, and a glowing reactor in the chest. Make it game-ready and put everything in its own collection."

Expected behavior:

1. Atom XE transcribes the voice request if voice input was used.
2. The AI 3D agent interprets the request.
3. The agent generates a Blender job using the available scene context.
4. Atom XE sends the job to the local bridge.
5. Blender creates a collection such as `ATOM_XE_Robot_<id>`.
6. Blender creates the geometry, materials, and organization requested.
7. Blender saves the working `.blend` file when requested.
8. Atom XE reports completion.
9. The user says:

> "Make the legs 20 percent thicker and add vents to the shoulders."

10. The agent targets the existing generated collection/object set and applies the requested modifications.
11. Atom XE displays the updated result.

## Implementation Instructions to the Coding Agent

Do not merely describe how to build this feature. Inspect the repository and implement the feature in the existing Atom XE codebase.

Work incrementally:

1. Audit the existing application architecture.
2. Identify the correct integration points.
3. Create the AI 3D domain types and job protocol.
4. Implement the Atom XE UI.
5. Implement the AI-agent service using the project's existing AI infrastructure where possible.
6. Implement the local Blender bridge protocol.
7. Implement the Blender add-on.
8. Add connection/status handling.
9. Add safe job execution and error handling.
10. Add tests for protocol validation and critical UI/service behavior.
11. Add setup documentation explaining that Blender must already be installed.
12. Run the project's existing lint/typecheck/build/test commands where available.
13. Fix issues introduced by the implementation.
14. Do not expose secrets in the repository.
15. Keep the implementation modular and production-oriented.

When a capability cannot be completed without an external credential, OS-level permission, or a locally installed application, implement the integration boundary and clear setup instructions rather than faking successful execution.

## Final Product Goal

Atom XE should become an AI-assisted 3D creation environment where the user can simply say what they want and Blender does the actual 3D work locally.

The intended mental model is:

**User imagination → Atom XE → AI 3D Agent → Local Blender → 3D asset**

Blender remains the user's installed 3D application and execution environment. Atom XE provides the seamless AI/vibe-coding layer on top of it.
