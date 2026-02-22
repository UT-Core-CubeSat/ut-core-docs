---
sidebar_position: 1
title: Start Here
---

# Start Here

Welcome to **UT-CORE** — Utah Tech’s CubeSat bus + software stack.

This documentation is the “single source of truth” for:
- **How the system works** (architecture, interfaces, constraints)
- **How to build / flash / test** the firmware
- **How subsystems connect** (ICDs: CAN, power, connectors, I2C/SPI maps)
- **How we verify** requirements (test procedures + evidence)

## What is UT-CORE?

UT-CORE is our CubeSat core platform (bus) that integrates:
- Embedded firmware (Zephyr-based)
- Electrical/board-level interfaces (power, CAN, sensor busses)
- Procedures for bench bring-up and integration

If you’re new, your goal is to go from **“fresh clone” → “I can build and flash a known-good app”** in under 30 minutes.

## Quick links

- **Getting Started: Build + Flash** → [`getting-started-build-flash`](getting-started-build-flash.md)
- **Architecture** → (coming next) system overview, data/power paths
- **Interfaces (ICDs)** → (coming next) CAN IDs, message formats, connector pinouts
- **Operations** → (coming next) bench bring-up + troubleshooting checklists

## How to contribute to docs

Docs are treated like code:
- Write in Markdown
- Submit changes via PR
- Keep pages **specific + testable** (avoid vague “should” language)

**Definition of done (docs):**
If you change an interface or behavior, update:
1) the relevant doc page (ICD / procedure),
2) any diagrams/examples,
3) and include the “expected output” or acceptance check.