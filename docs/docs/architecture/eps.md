---
sidebar_position: 2
title: Electrical Power System (EPS)
---

# Electrical Power System (EPS)

## 1. Purpose

EPS generates, stores, regulates, and distributes electrical power for UT-CORE.

EPS protects the spacecraft from:
- Overcurrent
- Undervoltage
- Battery over-discharge
- Electrical faults

No power = no mission.

---

## 2. Functional Responsibilities

EPS shall:

- Convert solar energy to regulated bus voltage
- Safely charge batteries
- Distribute regulated power rails
- Monitor voltage, current, temperature
- Enforce overcurrent protection
- Signal brownout conditions to CDH

---

## 3. Architecture

### Hardware
- Solar panels
- Power regulation / MPPT stage
- Battery pack
- Protection circuitry
- Power distribution switching

### Telemetry
- Bus voltage
- Battery voltage
- Charge/discharge current
- Subsystem rail currents

---

## 4. Interfaces

- Solar input
- Battery pack
- Regulated power rails to subsystems
- Telemetry to CDH via CAN or analog interface

---

## 5. Performance Requirements

| Parameter | Requirement |
|------------|-------------|
| Bus voltage regulation | ±5% |
| Brownout detection threshold | Defined per MCU spec |
| Battery over-discharge | Hard cutoff enforced |
| Peak load support | ≥ worst-case ADCS + COMMS |
| Telemetry update rate | ≥ 1 Hz |

---

## 6. Operational Timeline

EPS operates whenever illuminated or battery-powered.

- Sunlight → charge + regulate
- Eclipse → battery discharge mode
- Fault → isolate affected rail immediately

---

## 7. Failure Modes & Safing

EPS shall:

- Isolate overcurrent rails
- Force SAFE mode on low battery
- Log fault telemetry
- Prevent deep battery discharge

---

## 8. Verification Strategy

- Load transient testing
- Solar simulation testing
- Eclipse endurance testing
- Fault injection validation