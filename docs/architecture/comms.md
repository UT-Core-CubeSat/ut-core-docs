---
sidebar_position: 4
title: Communications (COMMS)
---

# Communications (COMMS)

## 1. Purpose

COMMS provides bidirectional communication between UT-CORE and ground stations.

---

## 2. Functional Responsibilities

COMMS shall:

- Receive uplink commands
- Downlink telemetry
- Transmit experiment data
- Provide emergency beacon capability

---

## 3. Architecture

### Hardware
- UHF transceiver
- S-band transmitter
- Antenna system

### Software
- Command decoder
- Telemetry framing
- Downlink scheduling

---

## 4. Interfaces

- CAN interface with CDH
- Power from EPS
- RF antenna interfaces

---

## 5. Performance Requirements

| Parameter | Requirement |
|------------|-------------|
| Link margin | ≥ 3 dB |
| Uplink reliability | > 99% |
| Downlink rate | Mission-dependent |
| Beacon interval | Defined in SAFE |

---

## 6. Operational Timeline

- DOWNLINK mode → active transmit
- STANDBY → receive capable
- SAFE → emergency beacon only

---

## 7. Failure Modes & Safing

COMMS shall:

- Retry transmission on link failure
- Signal CDH on radio fault
- Default to SAFE beacon mode on critical error

---

## 8. Verification Strategy

- RF link margin analysis
- Ground station test
- Uplink command validation
- End-to-end data transmission test