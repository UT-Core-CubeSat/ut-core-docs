---
sidebar_position: 1
title: Command & Data Handling (CDH)
hide_table_of_contents: true
---

import CdhInterfaces from '@site/src/components/CdhInterfaces';

# Command & Data Handling (CDH)

## 1. Purpose

The Command & Data Handling subsystem (CDH) is the central coordination authority of UT-CORE.

CDH determines:
- What the spacecraft is doing
- When it is doing it
- Which subsystems are active
- How telemetry is recorded and transmitted

If CDH fails, the spacecraft loses coordination and mission execution capability.

---

## 2. Functional Responsibilities

Status reflects `apps/CDH/src/main.c` in [ut-core-zephyr](https://github.com/UT-Core-CubeSat/ut-core-zephyr). **Implemented** means it works in code today, **Partial** means part of it exists, and **Planned** means nothing is written yet.

| CDH shall | How | Status |
|---|---|---|
| Monitor subsystem health via CAN | Record every node's heartbeat in `node_alive[]` and flag any node silent for more than 5 s (`check_node_timeouts`) | Implemented, warning only |
| Execute command parsing from COMMS | Decode command opcodes in `handle_command`: SET_MODE, REBOOT, SET_LED, SET_PWR_STATE | Partial: no sender or range check, REBOOT is a no-op |
| Control board power through EPS | Send SET_PWR_STATE to EPS and confirm the `OP_RESP_SET_PWR_STATE` it returns | Partial: only on ground command |
| Track spacecraft position | Poll GNSS every 5 s and store the fix in `gnss_latest` | Partial: stored but not used |
| Maintain global spacecraft mode | Hold `current_mode` and broadcast mode changes to every board | Partial: SETUP → STANDARD at boot and ground SET_MODE only |
| Maintain spacecraft time reference | Set a mission clock from GNSS time and broadcast it | Planned |
| Schedule mission operations | Decide imaging passes from position and downlink windows from ground-station passes | Planned |
| Log telemetry to nonvolatile storage | Collect SOH from every board plus CDH's own temps, log to FRAM, hand packets to COMMS | Partial: temps are read; `telemetry_thread` is a placeholder |
| Enforce fault response policies | React to silent nodes, faults and over-temperature: enter ERROR, power-cycle the board through EPS | Planned |
| Protect itself from hangs | Kick the hardware watchdog every 15 ms from the highest-priority thread | Partial: the kick is commented out |

---

## 3. Architecture

### Hardware
- STM32U5 MCU (Zephyr-based firmware)
- TCAN3403 CAN transceiver on FDCAN1 (CAN FD: 500 kbit/s arbitration, 2 Mbit/s data phase, 29-bit IDs)
- 6× TMP1xx temperature sensors on I2C1 (0x48–0x4D)
- Nonvolatile storage (FRAM over SPI)
- Hardware watchdog (kicked on PA2)

### Software Components

Each component maps to one firmware thread, listed from highest to lowest priority.

| Component | Thread | Job |
|---|---|---|
| Watchdog Manager | `watchdog_thread` | Kicks the hardware watchdog |
| CAN receive | `can_rx_thread`, `can_process_thread` | Drains the CAN FIFO, filters by destination, dispatches by opcode |
| Command Parser | `handle_command` (called from `can_process_thread`) | Acts on ground commands |
| Scheduler | `scheduler_thread` | Broadcasts CDH's heartbeat every 1 s; will schedule mission tasks |
| GNSS poller | `gnss_thread` | Requests a position fix every 5 s |
| Health Monitor | `soh_thread` | Reads onboard temps and checks node timeouts every 500 ms |
| Mode Manager | `current_mode` | Holds the spacecraft mode; transition logic is planned |
| Telemetry Logger | `telemetry_thread` | Placeholder |

---

## 4. Board Interfaces

All board-to-board traffic is on the CAN bus (see [CAN Interface](/interfaces/can)). Every frame has a fixed payload length set by its opcode (2, 4 or 8 bytes as classic frames, or 12 to 64 bytes as CAN FD frames), and the sender and opcode are in the frame ID (see [Inter-Board Communications](/software/board-com)). CDH accepts only frames addressed to itself (0x01) or broadcast (0x1F).

<CdhInterfaces />

### What CDH consumes

| Information | From | Transport and message | What CDH does with it | Status |
|---|---|---|---|---|
| Heartbeat | Every node | CAN `OP_HEARTBEAT` 0x001, broadcast every 1 s | Marks the node alive in `node_alive[]`; warns after 5 s of silence | Implemented |
| State of health | GNSS, ADCS, MOTOR, SOLAR | CAN `OP_SOH_GNSS` 0x401, `OP_SOH_SOLAR` 0x402, `OP_SOH_MOTOR` 0x403, `OP_ADCS_SOH_ATTITUDE` 0x404 (fix and satellites; coil duty and temps; fault status; attitude) | Fault detection and downlink | Partial: `handle_health` only logs the sender |
| Position | GNSS | CAN FD `OP_GNSS_POS` 0x301 (12 bytes): lat and lon (int32, 1e-7°), ellipsoid altitude (int32, cm) | Stored in `gnss_latest`; will drive imaging and downlink decisions | Partial: stored, not used |
| Velocity | GNSS | CAN FD `OP_GNSS_VEL` 0x302 (12 bytes): ECEF vx, vy, vz (int32, cm/s) | Not yet used | Partial: received, only logged |
| GNSS time | GNSS | CAN `OP_GNSS_TIME` 0x305: GPS week and time of week | Will set the mission clock | Partial: received, only logged |
| Ground commands | COMMS | CAN commands: `OP_SET_MODE` 0x102, `OP_REBOOT` 0x103, `OP_SET_LED` 0x101, `OP_SET_PWR_STATE` 0x104 | Changes mode, reboots, forwards power commands to EPS | Partial: COMMS has no firmware yet |
| Load switch result | EPS | CAN `OP_RESP_SET_PWR_STATE` 0x204: load, state, status (0x00 ok / 0x01 error) | Confirms the power change | Implemented (EPS side is in `demo.c`) |
| Battery and power | EPS | CAN, opcode TBD | Low-power decisions | Planned |
| Board temperatures | CDH's own sensors | I2C1, 6× TMP1xx at 0x48–0x4D | CDH state of health | Implemented, printed only |

### What CDH decides

| Decision | Based on | Result | Status |
|---|---|---|---|
| Is each board alive? | Heartbeats | Timeout warning; later, power-cycle the board through EPS | Implemented, warning only |
| Which mode to be in | Ground SET_MODE; later position, battery, faults | `current_mode`; mode broadcast to every board | Partial |
| Which loads are powered | Ground commands; later faults and battery | SET_PWR_STATE to EPS | Partial |
| When to image | Position against the target, ADCS attitude | MISSION mode and a pointing command to ADCS | Planned |
| When to downlink | Position against the ground station | Downlink window for COMMS | Planned |
| What time it is | GNSS time | Mission clock and time broadcast | Planned |
| How to respond to a fault | Timeouts, SOH, temperatures | ERROR mode or a power cycle through EPS | Planned |

The code currently defines SETUP, STANDARD, MISSION and ERROR modes. Section 6 lists the target flight modes.

### What CDH produces

| Information | To | Transport and message | When | Status |
|---|---|---|---|---|
| CDH heartbeat | Every node | CAN `OP_HEARTBEAT` 0x001, broadcast; p0 carries CDH's current mode | Every 1 s | Implemented |
| Position request | GNSS | CAN `OP_GET_POS` 0x105 | Every 5 s | Implemented |
| Load switch command | EPS | CAN `OP_SET_PWR_STATE` 0x104: load 1–12, on/off | On command | Implemented |
| Mode and time broadcast | Every node | Mode: p0 of `OP_HEARTBEAT`; time opcode TBD | Mode every 1 s | Partial: mode only |
| Pointing command | ADCS | CAN, opcode TBD: mode and target | On mode change | Planned |
| Command acknowledgement | COMMS | CAN, an `OP_RESP_*` opcode (none defined for ground commands yet) | After each ground command | Planned |
| Telemetry packets | COMMS | CAN, opcodes TBD, split across frames (up to 64 bytes each as CAN FD frames, 8 bytes as classic) | During a downlink window | Planned |
| Watchdog kick | Hardware watchdog | GPIO PA2 | Every 15 ms | Partial: commented out |

### Cross-board paths

The numbers match the badges in the diagram.

| # | Path | Status |
|---|---|---|
| 1 | **Ground power command.** Ground station → (UHF) → COMMS → (CAN, `OP_SET_PWR_STATE` 0x104) → CDH → (CAN, `OP_SET_PWR_STATE` 0x104) → EPS → (CAN, `OP_RESP_SET_PWR_STATE` 0x204) → CDH → (CAN, acknowledgement, opcode TBD) → COMMS → (UHF) → ground | CDH ↔ EPS implemented; COMMS and acknowledgement planned |
| 2 | **Position to imaging.** GNSS → (CAN, `OP_GNSS_POS` 0x301) → CDH decides MISSION → (CAN, SET_MODE broadcast) → every node, and → (CAN, pointing) → ADCS | Position implemented; decision and outputs planned |
| 3 | **Health to downlink.** Every node → (CAN, HEARTBEAT and SOH) → CDH, plus onboard temps over I2C → (CAN, telemetry) → COMMS → (UHF) → ground | Collection implemented; downlink planned |
| 4 | **Low battery.** EPS → (CAN, battery telemetry) → CDH decides LOW_POWER → (CAN, SET_MODE broadcast) → every node, → (CAN, SET_PWR_STATE off) → EPS, and → (CAN, sun-point) → ADCS | Planned |

---

## 5. Performance Requirements

| Parameter | Requirement |
|------------|-------------|
| Mode transition latency | < 500 ms |
| Telemetry logging reliability | 100% during EXPERIMENT |
| Scheduler timing accuracy | ±10 ms |
| Heartbeat supervision interval | ≤ 1 s |
| Timekeeping drift (no GNSS) | < 100 ppm |

---

## 6. Operational Timeline

CDH operates continuously when powered.

Mode behavior:

- SAFE → minimal activity, monitor health
- STANDBY → maintain readiness
- PHOENIX → fault recovery logic
- EXPERIMENT → schedule and execute mission tasks
- DOWNLINK → coordinate data transmission

---

## 7. Failure Modes & Safing

CDH shall default to SAFE on:
- Brownout signal from EPS
- Loss of critical subsystem heartbeat
- Watchdog reset

All resets must log fault cause before re-entering normal operation.

---

## 8. Verification Strategy

- Mode transition timing test
- Telemetry endurance logging test
- Watchdog recovery validation
- CAN heartbeat supervision test
