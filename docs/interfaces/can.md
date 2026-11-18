---
sidebar_position: 0
title: Can Interface
---

# Can Interface

## Getting started on CAN

- https://www.youtube.com/watch?v=egS-FNndwME
- https://en.wikipedia.org/wiki/CAN_bus

## CAN Bus Command Map

Reference for which messages are sent across the shared bus, and from/to which board. Names are the opcodes in
`common/ops.h`. Payload layouts, lengths and the frame format are on the
[Inter-Board Communications](/software/board-com) page.

The bus is CAN FD (500 kbit/s arbitration, 2 Mbit/s data phase), but only messages longer than 8 bytes are sent as FD frames; the rest are classic frames. FD is enabled on CDH and GNSS only so far, and a classic-only board treats FD frames as errors (see [CAN FD status](/software/board-com#can-fd-status)).

Every board accepts frames addressed to its own node ID or to broadcast (0x1F), and broadcasts an
`OP_HEARTBEAT` once per second. Heartbeats are listed once here rather than per board.

### CDH
- **RX (Incoming)**
  - `OP_HEARTBEAT` — from every node (liveness)
  - `OP_SET_MODE`, `OP_REBOOT`, `OP_SET_LED` — from ground/COMMS
  - `OP_SET_PWR_STATE` — from ground/COMMS, forwarded to EPS
  - `OP_RESP_SET_PWR_STATE` — from EPS
  - `OP_RESP_GET_POS`, `OP_RESP_SET_UPDATE_RATE` — from GNSS
  - `OP_GNSS_POS` (12-byte CAN FD frame), `OP_GNSS_VEL` (12-byte CAN FD frame), `OP_GNSS_TIME` — from GNSS (only position is parsed today; velocity and time are logged)
  - `OP_SOH_GNSS`, `OP_SOH_SOLAR`, `OP_SOH_MOTOR`, `OP_ADCS_SOH_ATTITUDE` — SOH from each board (logged)
- **TX (Outgoing)**
  - `OP_HEARTBEAT` — broadcast, p0 carries CDH's current mode
  - `OP_SET_PWR_STATE` — to EPS
  - `OP_GET_POS` — to GNSS (while in an operational mode)

### EPS
- **RX (Incoming)**
  - `OP_SET_PWR_STATE`: on/off for a board's load switch — from CDH
- **TX (Outgoing)**
  - `OP_RESP_SET_PWR_STATE` — to the sender (CDH)

### Solar Conglomerator
- **RX (Incoming)**
  - `OP_SET_MAG_DIPOLE`: magnetorquer dipole moment — from ADCS
- **TX (Outgoing)**
  - `OP_SOH_SOLAR` (temperature sensors, duty cycles) — to CDH
  - `OP_RESP_SET_MAG_DIPOLE` (duty percent) — to the sender

### ADCS
- **RX (Incoming)**
  - `OP_HEARTBEAT` — from CDH (mode)
- **TX (Outgoing)**
  - `OP_SET_MAG_DIPOLE` — to Solar Conglomerator
  - `OP_SET_WHEEL_RPM` — to Motor Board
  - `OP_ADCS_SOH_ATTITUDE`, `OP_ADCS_WHEEL_RPM`, `OP_ADCS_MTQ_DIPOLE` — broadcast telemetry

### Motor Board
- **RX (Incoming)**
  - `OP_SET_WHEEL_RPM` — from ADCS (other senders are ignored)
- **TX (Outgoing)**
  - `OP_SOH_MOTOR` — broadcast
  - `OP_MOTOR_WHEEL_RPM` — broadcast wheel RPM telemetry

### GNSS
- **RX (Incoming)**
  - `OP_GET_POS` — from CDH. Replies with position telemetry and `OP_RESP_GET_POS`
  - `OP_SET_UPDATE_RATE` — from CDH. Replies with `OP_RESP_SET_UPDATE_RATE` (the accepted rate, or 0 if rejected)
- **TX (Outgoing)**
  - `OP_SOH_GNSS` — to CDH
  - `OP_GNSS_POS` and `OP_GNSS_VEL` (12-byte CAN FD frames), `OP_GNSS_TIME` — to CDH
  - `OP_RESP_GET_POS`, `OP_RESP_SET_UPDATE_RATE` — to the sender

### Fake Comms (ground stand-in)
- **RX (Incoming)**
  - Everything sent to UDP
- **TX (Outgoing)**
  - Commands to CDH:
    - Enable ADCS
    - Turn on x board
