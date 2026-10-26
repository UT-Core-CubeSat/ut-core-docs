---
sidebar_position: 3
title: Global Navigation Satellite System (GNSS)
hide_table_of_contents: true
---

import GnssInterfaces from '@site/src/components/GnssInterfaces';

# Global Navigation Satellite System (GNSS)

## 1. Purpose

The GNSS board tells the spacecraft where it is and what time it is. It drives an Orion B16 receiver and reports the fix to CDH over the CAN bus.

CDH uses GNSS data to decide:
- Whether the spacecraft is over an imaging target
- When the next ground-station pass will be
- What time it is, once a time frame exists

GNSS only talks to CDH. CDH asks for position, and GNSS packages the fix and sends it back.

---

## 2. Functional Responsibilities

Status reflects `apps/GNSS` in [ut-core-zephyr](https://github.com/UT-Core-CubeSat/ut-core-zephyr). **Implemented** means it works in code today, **Partial** means part of it exists, and **Planned** means nothing is written yet.

| GNSS shall | How | Status |
|---|---|---|
| Configure the receiver at boot | `orion_config_cubesat_default`: binary output, 1 Hz updates, GPS + GLONASS, normal power | Implemented |
| Read navigation data from the receiver | UART interrupt into a ring buffer; a parser thread decodes each 0xA8 nav message | Implemented |
| Process latitude and longitude | Convert 1e-7° to 1e-4° (about 11 m) to fit two values in one CAN frame | Implemented |
| Send position to CDH | GNSS_POS 0x02 every 5 s and in reply to GET_POS 0x61 | Implemented |
| Report state of health to CDH | GNSS_SOH 0x01 every 5 s: fix mode, satellites, DOP, rate, driver status | Implemented |
| Broadcast a heartbeat | HEARTBEAT 0x30 every 1 s | Implemented |
| Accept update-rate changes | SET_UPDATE_RATE 0x62 reconfigures the receiver and acks with the new rate | Implemented on GNSS; CDH never sends it |
| Process speed | ECEF velocity is decoded by the driver but not sent | Partial |
| Provide time and altitude | GPS week, time of week and altitude are decoded but not sent | Partial |
| Enter low power on command | `orion_config_low_power` exists but nothing calls it; no mode command from CDH yet | Planned |
| Watch for a silent CDH | CDH's heartbeat is logged only | Partial |

---

## 3. Architecture

### Hardware
- STM32U5 MCU (Zephyr-based firmware)
- Orion B16 GNSS receiver on LPUART1: PC1 TX, PC0 RX, 115200 baud
- Antenna feed: 90 Ω coaxial connector and impedance-controlled trace (see [GNSS Board](/hardware/boards/gnss))
- TCAN3403 CAN transceiver on FDCAN1 (500 kbit/s, 29-bit IDs); silent on PA9, shutdown on PA10
- Debug console on USART3: PC4 TX, PC5 RX, 115200 baud
- Status LEDs on PC11, PC12, PC13

### Software Components

| Component | Where | Job |
|---|---|---|
| Orion driver | `orion_b16/orion_b16_driver.c` | UART interrupt fills a 1 KB ring buffer; a parser thread (priority 5, 2 KB stack) decodes frames and keeps the latest fix behind a mutex. Commands wait for the receiver's ACK or NACK. |
| Frame parser | `orion_b16/orion_b16_parser.c` | Validates `[A0 A1][length][ID][body][checksum][0D 0A]` frames and counts good and bad frames |
| Commands and config | `orion_b16_commands.c`, `orion_b16_config.c` | Builds receiver commands; the CubeSat default and low-power setup recipes |
| Nav callback | `on_nav_update` in `src/main.c` | Logs every new fix |
| CAN RX thread | `can_rx_thread` in `src/main.c` | Priority 5, 16-frame queue, accepts frames to 0x06 or broadcast; dispatches heartbeats and commands |
| Main loop | `main` in `src/main.c` | 100 ms tick: heartbeat every 1 s, health and position every 5 s, plus a stats log line |

---

## 4. Board Interfaces

GNSS has two external links: satellite signals into the receiver, and the CAN bus to the rest of the spacecraft (see [CAN Interface](/interfaces/can)). Inside the board, the receiver and the MCU talk over UART. Every CAN frame carries an 8-byte payload, `[src, opcode, p2–p7]`, with multi-byte values big-endian.

<GnssInterfaces />

### What GNSS consumes

| Information | From | Transport and message | What GNSS does with it | Status |
|---|---|---|---|---|
| Satellite signals | GPS and GLONASS satellites | L1 RF through the antenna | The receiver computes the fix | Implemented |
| Navigation data | Orion B16 | UART, binary message 0xA8: fix mode, satellites, GPS week, time of week, lat/lon (1e-7°), altitude (cm), DOP, ECEF position and velocity | Stored as the latest fix | Implemented |
| Command ACK / NACK | Orion B16 | UART, binary 0x83 / 0x84 | Confirms each configuration command | Implemented |
| Position request | CDH | CAN `CLS_COMMAND` GET_POS 0x61, ID `0x0C004182`, every 5 s | Sends GNSS_POS, then CMD_RESP | Implemented |
| Update-rate change | CDH | CAN `CLS_COMMAND` SET_UPDATE_RATE 0x62, p2 = rate in Hz | Reconfigures the receiver; acks with the rate or 0x00 | Implemented on GNSS; CDH never sends it |
| Heartbeats | Every node | CAN `CLS_HEARTBEAT` 0x30, broadcast | Logged | Partial |
| Mode command | CDH | CAN, opcode TBD | Switch to low-power settings in LOW_POWER mode | Planned |

### What GNSS decides

| Decision | Based on | Result | Status |
|---|---|---|---|
| Is the fix good enough to send? | The receiver's valid flag | Skip GNSS_POS when there is no valid fix | Implemented |
| Did the receiver accept a setting? | ACK or NACK from the receiver | CMD_RESP with the new rate, or 0x00 on failure | Implemented |
| How to fit values into 8 bytes | Fixed scaling | Lat/lon to 1e-4° as 24-bit integers; DOP ×10 capped at 255 | Implemented |
| When to save power | A mode command from CDH | Apply `orion_config_low_power` (1 Hz, power-save) | Planned |

### What GNSS produces

| Information | To | Transport and message | CAN ID | When | Status |
|---|---|---|---|---|---|
| Position | CDH | CAN `CLS_TELEMETRY` GNSS_POS 0x02: p2–p4 latitude, p5–p7 longitude, signed 24-bit, 1e-4° | `0x08018044` | Every 5 s and after GET_POS, only with a valid fix | Implemented |
| State of health | CDH | CAN `CLS_HEALTH` GNSS_SOH 0x01: p2 fix mode, p3 satellites, p4 HDOP×10, p5 PDOP×10, p6 rate Hz, p7 flags (bit 0 = driver running) | `0x1001804A` | Every 5 s | Implemented |
| Heartbeat | Every node | CAN `CLS_HEARTBEAT` 0x30, broadcast | `0x1001BFC0` | Every 1 s | Implemented |
| Command responses | CDH | CAN `CLS_CMD_RESP`: 0x61 with p2 = 0x01; 0x62 with p2 = rate or 0x00 | `0x10018043` | After each command | Implemented |
| Time, altitude, velocity | CDH | CAN, opcodes TBD | | Planned rate 1 s | Planned |
| Receiver configuration | Orion B16 | UART binary commands: update rate, constellations, power mode, message type | | At boot and on SET_UPDATE_RATE | Implemented |
| Log output | Debug console | USART3, 115200 baud | | Every fix and every 5 s | Implemented |

### Cross-board paths

The numbers match the badges in the diagram.

| # | Path | Status |
|---|---|---|
| 1 | **Position.** Satellites → (L1 RF) → Orion B16 → (UART, 0xA8) → Orion driver → GNSS app → (CAN, GNSS_POS 0x02) → CDH stores it in `gnss_latest`. CDH can also trigger this with GET_POS 0x61. | Implemented; CDH doesn't use the position yet |
| 2 | **Fix quality.** Same route to the GNSS app → (CAN, GNSS_SOH 0x01) → CDH `handle_health` | Partial: CDH only logs it |
| 3 | **Update-rate change.** CDH → (CAN, SET_UPDATE_RATE 0x62) → GNSS app → Orion driver → (UART, config command) → Orion B16 → (UART, ACK 0x83) → Orion driver → GNSS app → (CAN, CMD_RESP 0x62) → CDH | GNSS side implemented; CDH never sends it |
| 4 | **Time.** Orion B16 → (UART, GPS week and time of week in 0xA8) → GNSS app → (CAN, time frame TBD) → CDH sets the mission clock and broadcasts it to every board | Planned; the data is already decoded |
| 5 | **Liveness.** GNSS app → (CAN, HEARTBEAT 0x30 broadcast) → CDH `node_alive[]`, which warns after 5 s of silence | Implemented |

---

## 5. Timing

These are the intervals in the code today.

| Item | Value | Set by |
|---|---|---|
| Receiver fix rate | 1 Hz | `orion_config_cubesat_default(&gnss_driver, 1, false)` |
| Heartbeat | 1 s | `HEARTBEAT_INTERVAL_MS` |
| State of health | 5 s | `SOH_INTERVAL_MS` |
| Position | 5 s, plus each GET_POS reply | `POS_INTERVAL_MS` |
| CDH position poll | 5 s | `GNSS_POLL_MS` in CDH `board_config.h` |
| Main loop tick | 100 ms | `k_msleep(100)` |
| UART / CAN | 115200 baud / 500 kbit/s | Board overlay / `can_setup` |

---

## 6. Failure Modes

| Failure | What happens today |
|---|---|
| No valid fix | GNSS_POS is not sent and GNSS_SOH reports fix mode 0. The GET_POS reply still says 0x01, so CDH can't tell from the reply that no position was sent. |
| Receiver doesn't start | `main` returns before the CAN bus is brought up, so no heartbeat is sent and CDH flags GNSS as timed out after 5 s. |
| Corrupt UART frames | The parser drops the frame, resyncs on the next start bytes and counts it in `frames_err`, which is logged every 5 s. |
| Receiver rejects a setting | SET_UPDATE_RATE is answered with 0x00 instead of the rate. |
| CDH goes silent | GNSS keeps running and logs nothing unusual; it does not track CDH's heartbeat. |

---

## 7. Known Issues

- **Fix-mode numbers in the SOH comment are wrong.** The `send_gnss_soh` comment lists 0 none, 2 = 2D, 3 = 3D, 4 = 3D+DGPS. The receiver actually reports 1 = 2D, 2 = 3D, 3 = 3D+DGPS (`ORION_FIX_*` in `orion_b16_protocol.h`), and that is what goes on the bus.
- **DOP scaling is unverified.** The code assumes the receiver's DOP is ×100; there is a `@todo` to confirm it against the datasheet.
- **Opcodes overlap the shared list.** GNSS_SOH 0x01 and GNSS_POS 0x02 have the same values as OP_PING and OP_PONG in `can_proto.h`. The message class keeps them apart today; moving the GNSS opcodes into `can_proto.h` would prevent future clashes.
- **Each fix can be sent twice.** GNSS streams GNSS_POS every 5 s and CDH also polls every 5 s, so CDH gets the same fix twice. The team should pick polling or streaming.
- **Commands aren't length-checked.** `handle_command` reads `data[1]` and `data[2]` without checking the frame length (marked `@bug` in the code).
- **Only GPS and GLONASS are on.** The receiver also supports Galileo and BeiDou; they are switched off in the default config.

---

## 8. Verification Strategy

Proposed tests:

- Outdoor or simulator fix test: time to first fix, and position compared to a known location
- CAN round trip: CDH sends GET_POS, check that GNSS_POS and CMD_RESP arrive with the expected IDs and scaling
- Update-rate command: send SET_UPDATE_RATE 0x62 and confirm both the receiver ACK and the CMD_RESP value
- No-fix behavior: with the antenna disconnected, confirm GNSS_POS stops and GNSS_SOH reports fix mode 0
- Heartbeat supervision: power-cycle GNSS and confirm CDH flags and then clears the timeout
