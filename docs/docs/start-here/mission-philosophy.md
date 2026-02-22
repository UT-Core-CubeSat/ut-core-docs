---
sidebar_position: 3
title: Mission Philosophy & System Overview
---

# Mission Philosophy & System Overview

If you're reading this as the new team:

You have **two semesters.**

That sounds like a long time.

It is not.

Everything in this system was built with one goal:
> Make your life easier while preserving performance.

UT-CORE was designed to allow Utah Tech to become a serious player in **Earth-imaging CubeSats** — which, to be clear, are among the hardest types of CubeSats to build.

Why?

Because Earth imaging demands:
- Extremely tight pointing requirements  
- Stable attitude control  
- Coordinated subsystem timing  
- Reliable downlink performance  

This is not a “throw it in orbit and see what happens” satellite.

It is a precision instrument.

---

# Mission-Agnostic by Design

Your mission will probably not be the same as ours.

That is intentional.

We designed UT-CORE to be **mission agnostic**.

Modularity was the name of the game.

The structure supports two primary slot types:

- **1.6 mm PCB slots** (for electronics boards)
- **Thicker aluminum structural slots** (for stiffness + mounting heavier components)

These thicker slots support:
- ADCS reaction wheels
- EPS batteries
- Other high-load hardware

The goal was simple:

> Swap missions. Keep the bus.

---

# Structural Architecture

The mechanical design emphasizes:

- Simple assembly
- Board-level modularity
- Centralized power and data routing

Every board:

1. Slides into a slot
2. Connects to a **40-pin central backplane connector**
3. Receives:
   - Power (from EPS)
   - CAN bus access (for subsystem communication)

No wire nests.  
No floating harness chaos.  
Everything is card-based.

---

# Current Subsystem Architecture

As of this documentation revision, UT-CORE contains:

## Command & Data Handling (CDH)

Components:
- CDH board
- GNSS module

Responsibilities:
- Central system brain
- Mode control (SAFE, STANDBY, PHOENIX, EXPERIMENT, DOWNLINK)
- Telemetry storage
- Pass prediction
- Subsystem coordination

CDH determines:
- What happens
- When it happens
- Who is allowed to consume power

---

## Attitude Determination & Control System (ADCS)

Components:
- Motor control board
- ADCS calculation board
- Star tracker board

Responsibilities:
- Determine satellite orientation
- Control reaction wheels
- Maintain precise pointing

For Earth imaging missions, this subsystem defines mission success.

---

## Electrical Power System (EPS)

Components:
- EPS board
- Solar panels
- Solar power aggregator ("solar conglomerator")
- Batteries

Responsibilities:
- Generate power
- Store power
- Distribute power safely
- Protect the satellite from electrical faults

No power = no mission.

---

## Communications (COMMS)

Components:
- Comms board
- UHF antenna
- S-band antenna

Responsibilities:
- Ground station communication
- Telemetry downlink
- Command uplink

If CDH is the brain, COMMS is the mouth and ears.

---

# Design Principles

Throughout UT-CORE development, we prioritized:

### 1. Modularity
Boards can be swapped without redesigning the bus.

### 2. Clear Interfaces
All boards communicate via CAN.
Power distribution is centralized through EPS.

### 3. Assembly Simplicity
Slide-in boards.
Backplane connectors.
Minimal custom wiring.

### 4. Expandability
Your payload will be different.
The system should not fight you.

---

# Modes of Operation

The satellite operates in defined modes:

- **SAFE** – Minimal power, protect hardware
- **STANDBY** – Nominal idle
- **PHOENIX** – Recovery / fault management
- **EXPERIMENT** – Mission execution
- **DOWNLINK** – Active communication with ground

Mode control is centralized through CDH.

Every subsystem must behave differently depending on the active mode.

---

# Final Note to the New Team

This system was not designed to be “clever.”

It was designed to be:

- Stable
- Expandable
- Debuggable
- Flyable

You do not have time to redesign the bus.

You have time to build a mission.

Understand the architecture.
Respect the interfaces.
Protect the schedule.

Then go build something incredible.