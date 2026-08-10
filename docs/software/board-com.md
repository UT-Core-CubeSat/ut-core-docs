---
sidebar_position: 0
title: Inter-Board Communications
---

# Inter-Board Communications — CDH

This was the base layout for how we wanted the CAN protocol to work. To see how the CAN protocol ended up looking, check the `can_proto.h` file in the GitHub repository.

## CAN-BUS Node IDs

| Node   | ID   |
|--------|------|
| CDH    | 0x01 |
| EPS    | 0x02 |
| COMMS  | 0x03 |
| ADCS   | 0x04 |
| MOTOR  | 0x05 |
| GNSS   | 0x06 |
| STAR   | 0x07 |

## Arbitration ID Layout (29-bit)

```
[P:3][CLASS:5][SRC:6][DST:6][INST:9]
```

- **P (Priority):** How urgent is this? 0 = most urgent, 7 = least urgent.
- **CLASS (Message Type):** What kind of message is this (see Message Classes below).
- **SRC (Source):** Who sent this? Uses the Node IDs above.
- **DST (Destination):** Who is this message for? 0 means "broadcast" to everyone.
- **INST (Instance/Subject):** A specific sub-ID for this message type. For example, if the Class is "Command," the Instance would be which command.

**Example — CDH Heartbeat:**
```
001|00000|000001|000000|000000000
```

### Plain-language summary

- **Node IDs** — the "addresses" or "phone numbers" for each main component.
- **Arbitration ID** — the "envelope" for every message. It explains who sent it, who it's for, how important it is, and what kind of message it is (status update, command, data file, etc.).
- **Message Classes** — the "what kind" part; see below for the full catalog and what data each contains.

## Message Classes (Types)

| Class ID | Message Type | Class ID | Message Type |
|----------|---------------|----------|----------------|
| 0        | Heartbeat     | 8        | ParamResp      |
| 1        | Timesync      | 9        | "File"         |
| 2        | Command       | 10       | Boot           |
| 3        | CmdResp       | 11       | Health         |
| 4        | Telemetry     | 12       | Sync/RTC       |
| 5        | Event         | 13       | Debug          |
| 6        | ParamGet      | 14...31  | Reserved       |
| 7        | ParamSet      |          |                |

---

## CDH (Node 1) — Message Set Details

Specific messages that the CDH (main computer, Node 1) sends and receives.

### Heartbeat (Class 0)

**Summary:** A simple "I'm alive" signal that the CDH broadcasts regularly. Tells other parts of the system its current status (e.g., "booting up" or "running normally"), software version, and uptime.

**Example:** CDH (Source: 1) sends its heartbeat to Everyone (Destination: 0).

- **ID:** `[P=1][CLASS=0][SRC=1][DST=0][INST=0]`
- **Payload (8 bytes):**

  | Field | Description |
  |---|---|
  | `u8 ver` | currently 1 |
  | `u8 state` | 0=BOOT, 1=SAFE, 2=STANDBY, 3=OP, 4=FAULT, 5=SHUTDOWN |
  | `u8 major` | CDH firmware major version |
  | `u8 minor` | CDH firmware minor version |
  | `u16 uptime_s_mod1d` | uptime in seconds, resets every 24 hours |
  | `u8 hb_seq` | counter that wraps from 0...255 |

- **Subscriber action:** Update liveness; if `state == FAULT`, take action.

### Time Sync (Class 1)

**Summary:** Used by the CDH to keep all other components' clocks synchronized. Broadcasts the official "master time" so all parts of the system agree on the exact time — critical for coordinating tasks.

**Example:** CDH (Source: 1) broadcasts the current time to Everyone (Destination: 0).

- **ID:** `[P=0][CLASS=1][SRC=1][DST=0][INST=0]`
- **Payload (12 bytes):**

  | Field | Description |
  |---|---|
  | `u64 unix_ms` | time master value in milliseconds |
  | `u16 t_unc_us` | +/- time uncertainty, in microseconds |
  | `u8 epoch` | 0=UNIX, 1=TAI, 2=GPS |
  | `u8 flags` | bit0=leap_announce, bit1=valid |

- **Notes:** Nodes should slew-correct their local clock. ADCS/GNSS may discipline more tightly.

### Command (Class 2) & Command Response (Class 3)

**Summary:** How the CDH tells other parts what to do. Commands (Class 2) are sent to a device (e.g., "reboot yourself"). A Command Response (Class 3) is sent back to confirm receipt and success/failure.

**Example:** To reboot the radio, CDH (Source: 1) sends a command to COMMS (Destination: 3). COMMS then sends a response back from COMMS (Source: 3) to CDH (Destination: 1).

- **General Command ID (Class 2):** `[P=2][CLASS=2][SRC=1][DST=target][INST=cmd_id]`
- **Common Command IDs (INST):**

  | INST | Command | Payload |
  |---|---|---|
  | 1 | `CDH_SET_MODE` | `u8 new_state` (as in heartbeat states) |
  | 2 | `NODE_REBOOT` | `u8 reason` (0=soft, 1=into_bootloader, 2=to_safe) |
  | 3 | `CLEAR_FAULTS` | No payload |
  | 4 | `PARAM_SET` | see Parameter Protocol section |

- **Command Response ID (Class 3):** `[P=2][CLASS=3][SRC=target][DST=1][INST=cmd_id]`
  - Payload: `u8 status` (e.g., 0=OK, 1=Error)

### Telemetry (Class 4)

**Summary:** Routine health and status data — voltage levels, temperature, memory usage, time spent in different modes. The main way the system reports its vital signs.

**Example:** CDH (Source: 1) broadcasts temperature and voltage readings to Everyone (Destination: 0) so any component can listen.

- **ID:** `[P=3][CLASS=4][SRC=1][DST=0][INST=subid]`
- **Rates:** 1 Hz nominal (once per second); some faster, some slower.
- **Sub-IDs (INST) & Payloads:**

  **0: `CDH_SYS`** [20 bytes]
  - `u16 v_5v_mv`, `u16 v_3v3_mv`, `u16 i_total_mA` — voltages, current
  - `i16 cpu_temp_cC` — CPU temperature in centi-Celsius
  - `u32 free_heap_B`, `u32 free_fs_kB` — free memory and file space
  - `u16 can_rx_err`, `u16 can_tx_err` — network error counters

  **1: `CDH_MODE_TIME`** [12 bytes]
  - `u32 t_boot_s, t_safe_s, t_op_s` — time spent in each mode

  **2: `CDH_WATCHDOG`** [8 bytes]
  - `u8 wd_enable_mask`, `u8 wd_trip_mask` — watchdog status
  - `u16 wd_kick_ms`
  - `u32 last_reset_reason`

### Event (Class 5)

**Summary:** Unlike routine telemetry, "Events" report a specific thing that just happened — informational (e.g., mode changed), a warning, or a critical error (e.g., brownout, out of file space).

**Example:** If the CDH detects a brownout (voltage drop), CDH (Source: 1) broadcasts this event to Everyone (Destination: 0).

- **ID:** `[P=2][CLASS=5][SRC=1][DST=0 or 1][INST=event_id]`
- **Payload (variable):**
  - `u8 sev` — 0=INFO, 1=WARN, 2=ERR, 3=CRIT
  - `u32 ts_ms` — timestamp
  - `u8 data[...]` — e.g., error code
- **Common event_ids:** 1=ModeChange, 2=Brownout, 3=RTCSet, 4=FSWarn, 5=FSFull, 6=ParamChanged, 7=BootloaderEntered

### Parameter Protocol (Classes 6, 7, 8)

**Summary:** Allows the CDH to read or change specific configuration settings on other devices.

- **ParamGet (Class 6):** ask for a setting's value.
- **ParamSet (Class 7):** change a setting's value.
- **ParamResp (Class 8):** response carrying the requested value or confirming the change.

**Example:** To check the ADCS's "log level" setting, CDH (Source: 1) sends a `ParamGet` to ADCS (Destination: 4). ADCS (Source: 4) replies with a `ParamResp` back to CDH (Destination: 1).

- **ParamGet (Class 6):** Ask for a parameter
  - ID: `[P=3][CLASS=6][SRC=1][DST=target][INST=key]`
- **ParamSet (Class 7):** Set a parameter
  - ID: `[P=2][CLASS=7][SRC=1][DST=target][INST=key]`
  - Payload: `u8 type|value...`
- **ParamResp (Class 8):** The response to a Get/Set
  - ID: `[P=2][CLASS=8][SRC=target][DST=1][INST=key]`
  - Payload: `u8 type|value...`

**CDH Parameter Map (Keys):**

| Key | Parameter | Type |
|---|---|---|
| 0x0001 | `cdh.state.default` | u8 |
| 0x0002 | `cdh.timesync.enable` | bool |
| 0x0003 | `cdh.log.level` | u8 |
| 0x0004 | `cdh.wd.period_ms` | u16 |
| 0x0005 | `cdh.reboot.on_fault` | bool |
| 0x0100 | `cdh.fs.log_mask` | u16 |

### Health (Class 11)

**Summary:** A super-compact summary of the entire system's health — a bitfield (series of on/off flags) showing whether any subsystem has a fault or is in a bad state. A quick-glance "check engine light" for the whole system.

**Example:** CDH (Source: 1) broadcasts the health summary to Everyone (Destination: 0) every two seconds.

- **ID:** `[P=3][CLASS=11][SRC=1][DST=0][INST=0]`
- **Notes:** Broadcast every ~2 seconds.
- **Payload [8 bytes]:** `u32 health_mask`, `u32 fault_mask`

### File Transfer / Logs (Class 9)

**Summary:** Used for sending large chunks of data, like log files or configuration files. Since a single message can't hold a whole file, this protocol breaks the file into chunks, sends them one by one, and manages acknowledgments (ACKs) to ensure the whole file arrives correctly.

**Example:** To send a new config file to the EPS, CDH (Source: 1) sends a `Start` message to EPS (Destination: 2), followed by a series of `DATA` messages. EPS (Source: 2) replies with `ACK` messages back to CDH (Destination: 1).

- **Purpose:** CDH is the source/sink for files (e.g., log dumps to ground, or distributing config).
- **Sub-IDs (INST):**

  | INST | Name | Description |
  |---|---|---|
  | 0x000 | `Start` | Payload has direction, total length, chunk size, and file name |
  | 0x001 | `DATA` | Payload has the chunk number and the actual data |
  | 0x002 | `ACK` | Payload has the next chunk expected and a status (OK, RETRY, ABORT) |
  | 0x003 | `END` | Payload has a final checksum to verify the file |

### Boot/DFU (Class 10)

**Summary:** Handles updating a device's firmware. Includes commands to make a device restart in "bootloader" mode (a special update-receptive state), then uses the File Transfer (Class 9) protocol to send the new software file.

**Example:** To update the GPS software, CDH (Source: 1) first sends a `NODE_REBOOT` command to GNSS (Destination: 6). GNSS (Source: 6) restarts and sends a "Bootloader Heartbeat" to Everyone (Destination: 0). Finally, CDH uses the File Transfer protocol to send the new software from CDH (Source: 1) to GNSS (Destination: 6).

- **Flows:**
  1. **Enter bootloader:** Send `Command.NODE_REBOOT(reason=1)` to the target device.
  2. **Bootloader heartbeat:** The device sends a `Heartbeat` (Class=0) with `state=BOOT`.
  3. **DFU:** Use the File Transfer (Class 9) protocol to send the new firmware file.
