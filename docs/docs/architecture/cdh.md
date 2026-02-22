---
sidebar_position: 1
title: Command & Data Handling (CDH)
---

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

CDH shall:

- Maintain global spacecraft mode
- Execute command parsing from COMMS
- Schedule mission operations
- Log telemetry to nonvolatile storage
- Maintain spacecraft time reference
- Monitor subsystem health via CAN
- Enforce fault response policies

---

## 3. Architecture

### Hardware
- STM32U5 MCU (Zephyr-based firmware)
- Nonvolatile storage (FRAM / Flash)
- GNSS module
- CAN transceiver

### Software Components
- Mode Manager
- Scheduler
- Telemetry Logger
- Command Parser
- Watchdog Manager
- Health Monitor

---

## 4. Interfaces

- CAN bus (primary system communication)
- GNSS interface (UART/SPI)
- Nonvolatile storage (SPI)
- EPS power rail
- COMMS data link interface

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