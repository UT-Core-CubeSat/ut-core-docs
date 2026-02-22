---
sidebar_position: 3
title: Attitude Determination & Control System (ADCS)
---

# Attitude Determination & Control System (ADCS)

## 1. Purpose

ADCS determines spacecraft orientation and controls it to meet mission pointing requirements.

For Earth imaging missions, ADCS performance directly determines mission value.

---

## 2. Functional Responsibilities

ADCS shall:

- Estimate spacecraft attitude
- Control reaction wheels
- Maintain pointing stability
- Execute commanded slews
- Prevent wheel saturation

---

## 3. Architecture

### Hardware
- Reaction wheels
- Motor control board
- ADCS compute board
- Star tracker
- IMU

### Software
- State estimation (e.g., EKF)
- Control law (LQR / PID)
- Mode-dependent pointing logic

---

## 4. Interfaces

- CAN commands from CDH
- Power from EPS
- Sensor inputs (internal to subsystem)

---

## 5. Performance Requirements

| Parameter | Requirement |
|------------|-------------|
| Pointing accuracy | Mission-defined |
| Pointing stability | Maintain during exposure |
| Slew capability | Meet pass timing |
| Momentum margin | Avoid saturation |

---

## 6. Operational Timeline

- SAFE → detumble
- STANDBY → coarse pointing
- EXPERIMENT → precision tracking
- DOWNLINK → ground pointing

---

## 7. Failure Modes & Safing

ADCS shall:

- Fall back to coarse mode on star tracker loss
- Detect wheel saturation
- Signal CDH on estimator divergence

---

## 8. Verification Strategy

- Hardware-in-the-loop simulation
- Air bearing testing
- Step response analysis
- Momentum saturation testing