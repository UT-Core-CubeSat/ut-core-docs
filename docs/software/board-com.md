---
sidebar_position: 0
title: Inter-Board Communications
---

# Inter-Board Communications

How the boards talk to each other over the CAN bus.

:::info[Source of truth]
The firmware is authoritative. If this page and the code disagree, the code wins:
`common/can_proto.h` (ID layout, node IDs, send/receive API), `common/ops.h` (opcode registry and
payload lengths) and `common/can_proto.c` (filters and error counters), all in the
[ut-core-zephyr](https://github.com/UT-Core-CubeSat/ut-core-zephyr) repository.
:::

The bus runs **CAN FD** with **29-bit extended IDs**: **500 kbit/s** in the arbitration phase and **2 Mbit/s** in
the data phase of FD frames (set by `CAN_FD_DATA_BITRATE` in `can_proto.h`). Messages of 8 bytes or fewer are
ordinary classic frames; only messages longer than 8 bytes are sent as FD frames.

:::warning[FD is enabled on some boards only]
FD is switched on per app with `CONFIG_CAN_FD_MODE=y`. Today that is **CDH and GNSS** (and the `cdhModeTest`
app). EPS, MOTOR, SOLAR and ADCS still build as classic CAN and must not be on a bus that carries FD frames
until they are converted. See [CAN FD status](#can-fd-status).
:::

## Node IDs

| Node      | ID     |
|-----------|--------|
| CDH       | 0x01   |
| EPS       | 0x02   |
| COMMS     | 0x03   |
| ADCS      | 0x04   |
| MOTOR     | 0x05   |
| GNSS      | 0x06   |
| STAR      | 0x07   |
| SOLAR     | 0x08   |
| GROUND    | 0x10   |
| Broadcast | 0x1F (destination only) |

## Arbitration ID layout (29-bit)

```
[28:26]  PRIORITY  (3 bits)   0 = highest
[25:21]  SRC       (5 bits)   sender's node ID
[20:16]  DST       (5 bits)   receiver's node ID; 0x1F = broadcast
[15:4]   OP        (12 bits)  opcode: which message this is
[3:0]    RESERVED  (4 bits)   must be 0
```

- **PRIORITY** decides who wins when two nodes transmit at once. Lower wins.
- **SRC / DST** say who sent the frame and who it is for. Each board accepts only frames whose DST is its own
  ID or broadcast (set up in `can_setup()`).
- **OP** is the message type. There is no separate "class" or "instance" field: one opcode means exactly one
  message. The top nibble of the opcode is only a category, to keep bus dumps readable
  (see [Opcode registry](#opcode-registry)).

**Example, CDH heartbeat.** Priority 3, source CDH (0x01), destination broadcast (0x1F), opcode `OP_HEARTBEAT` (0x001):

```
011 | 00001 | 11111 | 000000000001 | 0000   =   0x0C3F0010
```

The firmware builds and splits IDs with the macros in `can_proto.h`: `CAN_ID_FULL(prio, src, dst, op)`,
and `CAN_ID_PRIO / CAN_ID_SRC / CAN_ID_DST / CAN_ID_OP` to read them back.

## Payload rules

The source node and opcode live in the ID, so **every data byte is application payload**. Payload bytes are
written p0..p7 (data[0]..data[7]) in the tables below.

- **Fixed length per opcode.** `can_op_len()` in `ops.h` gives each opcode's length: **2, 4 or 8 bytes** for
  classic frames (the smallest that fits), or a CAN FD length of **12, 16, 20, 24, 32, 48 or 64 bytes**. Unused
  trailing bytes within the length are 0.
- **Multi-byte values are big-endian.** `can_put_be32()` and `can_get_be32()` in `can_proto.h` pack and unpack
  signed 32-bit values.
- **Sending:** use `can_send2`, `can_send4` or `can_send8` for classic frames. For FD frames use `can_send12`,
  `can_send20` or `can_send64`, which take a pointer to the payload instead of individual bytes (any other FD
  length can call `can_send_frame()` directly). `can_send_frame()` returns `-EINVAL` if the length does not match
  the opcode, and nothing is put on the bus. A frame longer than 8 bytes is sent as FD with bit-rate switch, and
  returns `-ENOTSUP` if the app was not built with `CONFIG_CAN_FD_MODE`.
- **Receiving:** `can_decode()` drops any frame whose length does not match its opcode, whose opcode is
  unknown, or that is longer than 8 bytes but not flagged as an FD frame (`-EMSGSIZE`). Dropped frames are
  counted by `can_proto_rx_len_error_count()`, so handlers can trust `data[0..len-1]`. `can_packet_t.data` is
  64 bytes, and `dlc` holds the length in bytes (not the raw DLC code).
- **Send is non-blocking.** A return of 0 means the frame was queued, not that anyone received it. Failures
  (for example no node acknowledged) show up afterwards in `can_proto_tx_error_count()`.

### Adding a new message

1. Add the opcode to `ops.h` (value unique and ≤ 0xFFF), in the right category. Never define opcodes in an app.
2. Add it to `can_op_len()` with a length of 2, 4 or 8 (classic), or 12, 16, 20, 24, 32, 48 or 64 (FD; every node that receives it needs FD enabled).
3. Mirror it in `tools/ground_station/can_proto.py`.
4. Document the payload layout in the opcode's comment and in the tables here.

## Opcode registry

| Range | Category |
|-------|----------|
| 0x0xx | System / heartbeat |
| 0x1xx | Command (sender → target) |
| 0x2xx | Command response. Always `OP_RESP(command)` = command + 0x100 |
| 0x3xx | Telemetry |
| 0x4xx | State of health (SOH) |

### System (0x0xx)

| Opcode | Name | Len | Payload | Notes |
|--------|------|-----|---------|-------|
| 0x001 | `OP_HEARTBEAT` | 2 | p0 = CDH mode (0 for other nodes), p1 = 0 | Broadcast every 1 s by every node |
| 0x002 | `OP_PING` | 2 | none defined | Bench test |
| 0x003 | `OP_PONG` | 2 | none defined | Bench test |
| 0x004 | `OP_BUTTON` | 2 | none defined | Bench test |

CDH modes carried in p0 of its heartbeat: 0 = SAFE, 1 = STANDBY, 2 = DOWNLINK, 3 = EXPERIMENT, 4 = PHOENIX.

### Commands (0x1xx) and responses (0x2xx)

| Opcode | Name | Len | Payload | Direction |
|--------|------|-----|---------|-----------|
| 0x101 | `OP_SET_LED` | 2 | p0 = LED state | to CDH |
| 0x102 | `OP_SET_MODE` | 2 | p0 = requested mode (CDH accepts only SAFE or STANDBY) | to CDH |
| 0x103 | `OP_REBOOT` | 2 | none | to CDH (currently a no-op) |
| 0x104 | `OP_SET_PWR_STATE` | 2 | p0 = load number, p1 = state (1 on, 0 off) | CDH → EPS |
| 0x105 | `OP_GET_POS` | 2 | none | CDH → GNSS |
| 0x106 | `OP_SET_UPDATE_RATE` | 2 | p0 = rate in Hz | CDH → GNSS |
| 0x110 | `OP_SET_WHEEL_RPM` | 4 | p0 = motor (1..4, 0 = all), p1..p2 = int16 RPM | ADCS → MOTOR |
| 0x111 | `OP_SET_MAG_DIPOLE` | 8 | p0..p1 = mx, p2..p3 = my, p4..p5 = mz (int16, 1e-4 A·m² per LSB) | ADCS → SOLAR |
| 0x112 | `OP_SET_EPS_LOAD` | 2 | p0 = load (1..12, 0 = all), p1 = enable | defined, no sender yet |
| 0x204 | `OP_RESP_SET_PWR_STATE` | 4 | p0 = load, p1 = state, p2 = status (0 = OK, 1 = error), p3 = 0 | EPS → CDH |
| 0x205 | `OP_RESP_GET_POS` | 2 | p0 = 1 (ack) | GNSS → CDH |
| 0x206 | `OP_RESP_SET_UPDATE_RATE` | 2 | p0 = accepted rate, or 0 if rejected | GNSS → CDH |
| 0x210 | `OP_RESP_SET_WHEEL_RPM` | 2 | defined, not yet sent | MOTOR → sender |
| 0x211 | `OP_RESP_SET_MAG_DIPOLE` | 2 | p0 = duty percent | SOLAR → sender |
| 0x212 | `OP_RESP_SET_EPS_LOAD` | 2 | defined, not yet sent | EPS → sender |

### Telemetry (0x3xx)

| Opcode | Name | Len | Payload | Direction |
|--------|------|-----|---------|-----------|
| 0x301 | `OP_GNSS_POS` | 12 (FD) | p0..p3 = latitude, p4..p7 = longitude (int32, 1e-7°), p8..p11 = ellipsoid altitude (int32, cm) | GNSS → CDH |
| 0x302 | `OP_GNSS_VEL` | 12 (FD) | p0..p3 = ECEF vx, p4..p7 = vy, p8..p11 = vz (int32, cm/s) | GNSS → CDH |
| 0x305 | `OP_GNSS_TIME` | 8 | p0..p1 = GPS week, p2..p5 = time of week in centiseconds; p6..p7 = 0 | GNSS → CDH |
| 0x310 | `OP_MOTOR_WHEEL_RPM` | 4 | wheel RPM telemetry | MOTOR → broadcast |
| 0x311 | `OP_ADCS_WHEEL_RPM` | 8 | wheel 1..3 RPM in p0..p5 | ADCS → broadcast |
| 0x312 | `OP_ADCS_MTQ_DIPOLE` | 8 | mx, my, mz in p0..p5 | ADCS → broadcast |

Position and velocity were previously split across several 8-byte frames (24-bit lat/lon at 1e-4°, about 11 m,
and one frame per velocity axis with a sequence number). Each now fits in one 12-byte FD frame at full receiver
resolution, so the three velocity axes are always from the same nav snapshot and no sequence number is needed.
Opcodes 0x303 and 0x304 (the old VY and VZ) are retired.
GNSS time is GPS time, not UTC. Conversion is left to CDH or ground.

### State of health (0x4xx)

| Opcode | Name | Len | Payload | Direction |
|--------|------|-----|---------|-----------|
| 0x401 | `OP_SOH_GNSS` | 8 | p0 = fix mode (0 none, then the receiver's value: 1 = 2D, 2 = 3D, 3 = 3D+DGPS; see GNSS known issues), p1 = satellites, p2 = HDOP×10, p3 = PDOP×10, p4 = update rate Hz, p5 = flags (bit 0 = driver running), p6..p7 = 0 | GNSS → CDH |
| 0x402 | `OP_SOH_SOLAR` | 8 | temperatures and duty cycles (see `apps/SOLAR/src/main.c`) | SOLAR → CDH |
| 0x403 | `OP_SOH_MOTOR` | 4 | fault/status (see `apps/MOTOR/src/main.c`) | MOTOR → broadcast |
| 0x404 | `OP_ADCS_SOH_ATTITUDE` | 8 | qx, qy, qz in p0..p5 | ADCS → broadcast |
| 0x410 | `OP_SOH_CORE` | 8 | p0..p3 = uptime (s), p4..p5 = supply voltage (mV, 0xFFFF = read failed), p6 = temperature (°C, int8, -128 = read failed), p7 = schema version (high nibble) and reset cause (low nibble) | any node → CDH or broadcast |
| 0x411 | `OP_SOH_CAN_STATS` | 8 | p0 = TEC, p1 = REC, p2 = CAN flags (bit 0 error-warning, bit 1 error-passive), p3 = bus-off count, p4..p5 = error IRQ count, p6..p7 = RX overrun count (counts saturate) | any node → CDH or broadcast |

`OP_SOH_CORE` and `OP_SOH_CAN_STATS` use the shared pack/unpack code in `common/soh.h` and `soh.c`
(`soh_pack_core`, `soh_unpack_core`, `soh_pack_can`, `soh_unpack_can`, with host unit tests in `tests/host`).
**No board sends or handles them yet.** They are defined so the format and opcodes are fixed; they overlap in
purpose with the per-board SOH opcodes above, and which set stays has not been decided.

Per-board lists of what each node sends and receives are on the [CAN Interface](/interfaces/can) page.

## Ordering and priority

Frames with **different opcodes are not guaranteed to arrive in the order they were sent.** When several frames
are waiting to go out, the one with the lowest ID transmits first, and the opcode is part of the ID. In bench
testing, 8-byte frames sent back to back overtook 2- and 4-byte frames queued before them because their opcode
was higher. Nothing was lost or corrupted.

- Only one sender sending one opcode is guaranteed to stay in order.
- If a receiver needs to group frames (like a position frame and the velocity frame sent with it), put a shared sequence byte in them, or put the data in one frame.
- Priority is compared before the opcode. For urgent traffic, use a lower priority value rather than a
  low opcode number.
- Priority values currently used by the apps: CDH 3, EPS 4, ADCS 4, GNSS 4 (telemetry 2), SOLAR 4, MOTOR 2.
  They are set per app, not centrally, so check the app source before relying on them.

## Verification

The length rules were tested between the GNSS and CDH boards in November 2026, in both directions. CAN FD was
then tested on the same two boards (see below).

- 41 frames GNSS → CDH (2, 4 and 8 bytes, including real opcodes and a back-to-back burst), all received with the correct bytes; the real `OP_GNSS_POS` handler decoded a negative latitude correctly.
- The 32 test-opcode frames were echoed CDH → GNSS and all matched.
- 10 frames with the wrong length for their opcode were sent in each direction; all were dropped by `can_decode()`.
- Sending with a wrong length or null data returned `-EINVAL`.
- No send errors. The only anomaly was the reordering described above.

The test code was temporary and has been removed. Other boards (EPS, MOTOR, SOLAR, ADCS) share the same
`can_proto` code but were not part of this test.

### CAN FD (November 2026)

Tested between CDH and GNSS, with FD enabled on both, 500 kbit/s arbitration and 2 Mbit/s data phase.

- Stage 1: with FD mode on and only classic traffic, both boards booted and existing traffic still worked with no send errors.
- Stage 2: CDH sent a 64-byte FD ping every second and GNSS echoed it; the payload pattern matched and the echoed length was correct.
- Stage 3: the same ping/pong cycling through every FD length (12, 16, 20, 24, 32, 48, 64 bytes); all lengths passed with no corrupt payloads or send errors.

The test opcodes and code were temporary and have been removed. The 12-byte `OP_GNSS_POS` and `OP_GNSS_VEL`
frames that replaced the split position/velocity frames were then tested on the same two boards and passed
with no issues.

**Not tested:** data rates above 2 Mbit/s, and any real bus. The tests were on a bench setup without the final
wiring, termination or cable lengths, so the 2 Mbit/s data rate still needs confirming there.

---

## Planned / not implemented

The original design of this protocol had a class/instance ID, 8 to 20 byte variable payloads and several
message families. The firmware was simplified to the opcode scheme above, and **none of the following exists
yet**. They are kept here as intent for whoever builds them. Each needs new opcodes in `ops.h` and lengths of
2, 4 or 8 bytes, or an FD length of 12 to 64 bytes (see [CAN FD status](#can-fd-status)).

| Feature | Intent | What it needs under the current scheme |
|---------|--------|----------------------------------------|
| **Time sync** | CDH broadcasts a master time so every board agrees on the time. Nodes slew-correct their clocks; ADCS and GNSS may discipline tighter. | Original payload was 12 bytes (64-bit ms, uncertainty, epoch, flags), which now fits one FD frame with `can_send12`. `OP_GNSS_TIME` already carries GPS time to CDH. |
| **Events** | One-off notifications: mode change, brownout, RTC set, file system warning/full, parameter changed, bootloader entered. Severity INFO/WARN/ERR/CRIT with a timestamp. | One opcode per event or one event opcode with an event id; 8 bytes fits severity, id and a short timestamp. |
| **Parameter protocol** | Read and write named settings (log level, watchdog period, default state...) on any node, with a response carrying the value. | A get, set and response opcode with a 16-bit key plus value. Original key map: `cdh.state.default`, `cdh.timesync.enable`, `cdh.log.level`, `cdh.wd.period_ms`, `cdh.reboot.on_fault`, `cdh.fs.log_mask`. |
| **File transfer / logs** | Move large files (logs, configs) in chunks with acknowledgments: Start, DATA, ACK, END (checksum). | Four opcodes. With 64-byte FD frames, DATA carries roughly 60 bytes of file data per frame after a chunk number, which is about ten times more than 8-byte frames. |
| **Boot / DFU** | Reboot a node into its bootloader, then send new firmware over file transfer. | Needs `OP_REBOOT` with a reason code (soft, bootloader, to safe), a bootloader heartbeat state, and file transfer. |
| **CDH system telemetry** | Voltages, current, CPU temperature, free memory, CAN error counters, time in each mode, watchdog state. | Original sizes were 20, 12 and 8 bytes, which now fit single FD frames (`can_send20`, `can_send12`). `can_proto_tx_error_count()` and `can_proto_rx_len_error_count()` already exist for the error counters. |
| **Health summary** | CDH broadcasts a health mask and fault mask about every 2 s. | Original payload was two 32-bit masks (8 bytes), which fits as is. |
| **Clear faults** | Ground clears CDH's reboot lockout and recorded fault. | A new command opcode; CDH has the function (`cdh_clear_faults`) but nothing calls it. |

### CAN FD status

CAN FD is enabled on CDH and GNSS and tested between them (see [Verification](#verification)). The decision to
use FD was made; what remains is finishing the rollout.

**Done**

- `CONFIG_CAN_FD_MODE=y` in the CDH and GNSS apps; `can_setup()` checks the controller supports FD, sets the
  2 Mbit/s data bitrate and turns on FD mode. Classic frames still work in that mode.
- `can_send_frame()` and `can_decode()` handle FD lengths and DLC codes, with `can_send12/20/64` helpers.
- `OP_GNSS_POS` and `OP_GNSS_VEL` are FD messages.

**Still to do**

- **Other boards.** EPS, MOTOR, SOLAR and ADCS are still classic. Add `CONFIG_CAN_FD_MODE=y` to each app before they share a bus with FD traffic. The shared `can_proto` code already supports it.
- **Every node must support FD.** A classic-only node treats FD frames as errors. All boards use FDCAN peripherals with TCAN3403 transceivers, which support FD; that includes any bench adapter or ground-station tool on the bus.
- **Ground-station path.** The ground station's UDP packet format carries a fixed 8 data bytes, so it cannot carry FD frames; the UDP format and the bridge would need to change before it can show the 12-byte frames.
- **Data rate.** 2 Mbit/s works on the bench. Confirm it on the real bus, and only then consider 4 or 5 Mbit/s.

The 2/4/8-byte rule for classic opcodes is a project choice, not a hardware limit: classic CAN accepts any
length from 0 to 8.
