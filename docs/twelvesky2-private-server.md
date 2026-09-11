# TwelveSky2 Fenrir Server Integration

This repository links the open-source **TwelveSky-Fenrir/Server** project as a Git submodule at:

`third_party/twelvesky2-fenrir-server`

## Upstream

- Project: https://github.com/TwelveSky-Fenrir/Server
- License: MIT
- Pinned upstream commit: `d1f36c04db4396453448c5514d8e48f705020cbd`
- Stack: C# / .NET + SQL Server
- Upstream SDK target: .NET SDK `10.0.300`

The upstream project contains separate login-server and game-server projects, network/data/domain layers, and database scripts/migrations.

## Clone with the server

```bash
git clone --recurse-submodules https://github.com/marcusflow1-arch/atom-x-eve-os.git
cd atom-x-eve-os
```

If the main repo is already cloned:

```bash
git submodule update --init --recursive
```

## Build the upstream server

From `third_party/twelvesky2-fenrir-server`:

```bash
dotnet --version
dotnet restore
dotnet build
```

The upstream repository includes its database definitions under `Database/`, including migrations, schemas, stored procedures, tables, triggers, and views. Configure SQL Server according to the upstream project configuration before launching the login/game services.

## Updating the pinned server revision

```bash
cd third_party/twelvesky2-fenrir-server
git checkout main
git pull
cd ../..
git add third_party/twelvesky2-fenrir-server
git commit -m "Update TwelveSky2 Fenrir server"
```

## Important asset/client note

This integration intentionally includes only the MIT-licensed server project. It does not bundle proprietary TwelveSky2 game assets, executables, or other files whose redistribution rights are unclear. Use only game/client assets you are legally entitled to use.
