---
sidebar_position: 0
title: Can Interface
---

# Can Interface

## Getting started on CAN

- https://www.youtube.com/watch?v=egS-FNndwME
- https://en.wikipedia.org/wiki/CAN_bus

## CAN Bus Command Map

Reference for which messages are sent across the shared BUS, and from/to which board.

### EPS
- **RX (Incoming)**
  - `SetBoardPwrState`: On/Off board — from CDH
- **TX (Outgoing)**
  - SOH (voltages and currents) — to CDH
  - Heartbeat — to CDH

### Solar Conglomerator
- **RX (Incoming)**
  - `setMagDipoleMoment`: value — from ADCS
- **TX (Outgoing)**
  - SOH (temp sensors, duty cycles) — to CDH
  - Heartbeat — to CDH

### Fake Comms
- **RX (Incoming)**
  - Everything sent to UDP
- **TX (Outgoing)**
  - Commands to CDH:
    - Enable ADCS
    - Turn on x board

### CDH
- **RX (Incoming)**
  - Commands from Fake Comms
- **TX (Outgoing)**
  - `setBoardPwrState` — to EPS
  - ADCS (ON / OFF)
  - Heartbeat — to EPS

### ADCS
- **RX (Incoming)**
  - Enable (on/off) — from CDH
- **TX (Outgoing)**
  - `setMagneticDipoleMoment` — to Solar Conglomerator
  - `setMotorSpeed` — to Motor Board

### Motor Board
- **RX (Incoming)**
  - `setMotorSpeed` — from ADCS
- **TX (Outgoing)**
  - SOH — to CDH
  - Heartbeat — to CDH

### GNSS
- **RX (Incoming)**
  - `getLatLong` — from CDH
- **TX (Outgoing)**
  - SOH — to CDH
  - Heartbeat — to CDH
