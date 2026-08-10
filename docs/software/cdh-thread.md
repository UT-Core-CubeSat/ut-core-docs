---
sidebar_position: 0
title: CDH Thread Design
---


{/*
<span style={{color: 'red'}}>This text is red</span>
<span style={{color: 'green'}}>This text is green</span>
*/}


# CDH Thread Design


<span style={{color: 'red'}}>
Note that this is AI-Generated and was a baseline for our design of the CDH threads, it does not reflect the current state of the main app 
</span>
 

**CDH Software Requirements**

    - Manage CAN BUS Tx/Rx 
    - Compile SOH (State of Health) for subsystems 
    - Handle data routing 
    - Read Internal sensor data 
    - Tell subsystems what to do/when to do it 
    - Determine modes (ex: standby, sleep, deep sleep, low power) 
    - Monitor watchdog/pings 


## UT-CORE CDH Software Architecture Documentation 

**Platform:** STM32U5A5RJT6 

**RTOS:** Zephyr OS (v4.x) 

**Project:** University CubeSat – Command & Data Handling (CDH) 



## 1. System Overview 

The UT-CORE CDH board is responsible for coordinating all spacecraft subsystems, including: 

    - CAN Bus communication (EPS, ADCS, COMMS, payload boards) 
    - State of Health (SOH) collection 
    - GNSS-based mission decision making 
    - Mode determination and transitions 
    - Downlink scheduling 
    - Ground command handling 
    - Watchdog supervision 
    - Experiment timing and execution 

The board contains **two redundant STM32U5A5RJT6 MCUs**, with one active and one cold spare. Both MCUs run identical firmware. Hardware mechanisms determine which MCU is active. 

The system operates in four high-level modes: 

    1. Setup Mode 
    2. Standard Operating Mode 
    3. Mission Mode 
    4. Error Correction Mode 

Development is proceeding incrementally, beginning with Setup Mode. 

 

## 2. Architectural Philosophy 

### 2.1 Why Zephyr + Threads? 

This system has: 

    - Time-critical CAN interrupts 
    - Deterministic scheduling requirements 
    - Background SOH tasks 
    - Mission-planning logic 
    - Watchdog servicing requirements 

A simple superloop is insufficient for: 

    - Deterministic priority handling 
    - Real-time responsiveness 
    - Clear separation of concerns 
    - Scalability 

Therefore, we use: 

    - **Zephyr preemptive threads**
    - **Message queues**
    - **Event-driven architecture**
    - **Hardware interrupts for CAN**

This ensures: 

    - High-priority tasks (e.g., watchdog, CAN RX) preempt lower ones 
    - Modular subsystem isolation 
    - Deterministic timing behavior 
    - Scalability for mission mode expansion 

 

## 3. Execution Model 

### 3.1 Single-Core Threading Model 

The STM32U5A5RJT6 is a ***single-core MCU**. 

Important clarification: 

Only one thread executes at any instant. 

However, Zephyr uses: 

    - Context switching 
    - Priority-based preemption 
    - Time slicing 

This creates the appearance of concurrent execution. 

Thread behavior: 

    - Higher-priority threads preempt lower-priority ones. 
    - Interrupts preempt all threads. 
    - Cooperative threads run until they yield. 

 

## 4. Thread Layout 

The CDH firmware is structured into multiple functional threads. 

### 4.1 Setup Mode Thread 

Purpose: Perform system validation and initialization. 

Responsibilities: 

    - Set external watchdog GPIO high 
    - Read 96-bit unique chip ID 
    - Read PA6 hardware identification pin 
    - Validate UID ↔ hardware mapping 
    - Initialize CAN bus 
    - Read internal temperature sensors (I2C) 
    - Determine MCU role (MCU1 or MCU2) 
    - Log mismatch if UID and PA6 disagree 
    - Transition to next mode 

Priority: Medium 

 

### 4.2 CAN Thread 

Purpose: Manage CAN TX/RX. 

Responsibilities: 

    - Receive CAN frames via interrupt 
    - Parse subsystem messages 
    - Route commands 
    - Queue outgoing packets 
    - Detect missed pings 

Priority: High 

CAN RX is interrupt-driven to minimize latency. 

 

### 4.3 SOH Thread 

**Purpose:** Collect and compile system health. 

Responsibilities: 

    - Poll subsystem status 
    - Monitor voltages, currents, temperature 
    - Store SOH in structured buffer 
    - Prepare telemetry packets 

Priority: Medium-low 

 

### 4.4 Watchdog Thread 

**Purpose:** Maintain system liveness. 

Responsibilities: 

    - Toggle external watchdog GPIO periodically 
    - Monitor subsystem pings 
    - Detect software lockups 
    - Escalate to Error Mode if required 

Priority: High 

 

### 4.5 Mission Logic Thread (Future) 

**Purpose:** Autonomous mission execution. 

Responsibilities: 

    - Evaluate GNSS position 
    - Determine experiment pass windows 
    - Schedule imaging events 
    - Switch spacecraft modes 

Priority: Medium 

 

## 5. Setup Mode Design 

### 5.1 Purpose 

Setup Mode validates hardware identity and initializes the platform. 

It ensures: 

    - Correct MCU is active 
    - No board-level misconfiguration 
    - CAN bus is operational 
    - Sensors are responding 

### 5.2 Hardware Identification Strategy 

Each MCU is identified using two independent mechanisms: 

    1. **96-bit Unique Device ID**
    2. **GPIO Pin PA6**

| MCU | UID | PA6 |
|---|---|---|
| MCU1 | `00340016-41425007-20363651` | LOW |
| MCU2 | `0012001B-41425007-20363651` | HIGH |

Verification logic: 

    - Read UID 
    - Read PA6 
    - Determine expected role from UID 
    - Compare against PA6 
    - If mismatch: 
        - Log error 
        - Trust PA6 as authoritative 
        - Continue boot 

This provides hardware redundancy verification. 

 

## 6. Inter-Thread Communication 

The system uses: 

    - k_msgq (Message Queues) for CAN and command passing 
    - k_event for mode transitions 
    - Shared structures protected by mutex if necessary 

Data flow example: 

CAN RX ISR 

→ Push frame to message queue 

→ CAN thread processes frame 

→ Mode thread evaluates command 

→ Mission thread updates state 

 

## 7. Mode Management 

The system maintains a global mode state: 

```c
typedef enum { 
    MODE_SETUP, 
    MODE_STANDARD, 
    MODE_MISSION, 
    MODE_ERROR 
} system_mode_t;
```
 

Only the mode manager thread is allowed to change system mode. 

Mode transitions occur based on: 

    - Setup completion 
    - Ground commands 
    - Fault detection 
    - Watchdog timeout 
    - Mission timing events 

 

## 8. Error Handling Strategy 

Error Mode is entered when: 

    - UID ↔ PA6 mismatch 
    - CAN bus failure 
    - Missed subsystem pings 
    - Sensor read failures 
    - Internal fault detection 

In Error Mode: 

    - Nonessential subsystems are disabled 
    - Downlink of fault telemetry is prioritized 
    - Recovery attempts may be scheduled 

 

## 9. Determinism Strategy 

To maintain timing integrity: 

    - CAN RX handled in interrupt context 
    - High-priority watchdog thread 
    - Mission logic isolated from SOH polling 
    - No blocking calls in high-priority threads 
    - All delays use k_sleep() not busy-wait 

 

## 10. Scalability Plan 

Future additions will include: 

    - Time-synchronized scheduling using RTC 
    - Deterministic task scheduling table 
    - Persistent fault logging in flash 
    - Bootloader-based firmware update mechanism 
    - Cold spare MCU takeover logic 

 

## 11. Why This Architecture Is Suitable for a CubeSat 

This architecture provides: 

    - Deterministic real-time behavior 
    - Clear separation of responsibilities 
    - Redundancy verification 
    - Fault isolation 
    - Expandability for mission logic 
    - Clean certification path 

It balances: 

    - RTOS complexity 
    - Resource constraints of STM32U5 
    - Mission reliability requirements 

 

## 12. Summary 

The UT-CORE CDH firmware uses a preemptive multi-threaded Zephyr architecture designed for: 

    - Deterministic subsystem coordination 
    - Redundant MCU validation 
    - Real-time CAN handling 
    - Autonomous mission execution 
    - Fault-tolerant operation 

Setup Mode forms the foundation of system reliability by validating hardware identity and initializing communication before transitioning to operational states. 

Perfect — this is exactly the kind of thing reviewers and faculty love seeing in CubeSat documentation. 

Below is a clean **Thread Table** you can paste directly into Word. 

 

## 13. CDH Thread Table 

This table defines all active threads in the UT-CORE CDH firmware, including their responsibilities, priority levels, timing characteristics, and failure impact. 

 
### 13.1 Thread Priority Scheme

Zephyr uses lower numbers = higher priority.

| Priority Level | Value | Description |
|----------------|-------|-------------|
| Critical       | 0     | Hard real-time (watchdog, critical interrupts)
| High           | 1     | Time-sensitive communications
| Medium         | 3     | Mode logic and mission control
| Low            | 5     | Background SOH tasks
| Idle           | 15    | Lowest priority

### 13.2 CDH Thread Table

| Thread Name               | Priority | Type        | Period / Trigger    | Responsibilities | Failure Impact |
|---------------------------|---|--------------------|---------------------|------------------|----------------|
| Watchdog Thread           | 0 | Preemptive         | 100–500 ms periodic | Toggle external watchdog GPIO, monitor subsystem pings, detect lockups  | System reset if stalled
| CAN RX (ISR + Worker)     | 1 | Interrupt + Thread | Interrupt-driven    | Receive CAN frames, push to queue, validate packets     | Loss of subsystem communication
| CAN TX Thread             | 1 | Preemptive         | Event-driven        | Transmit queued CAN messages        | Command delays
| Mode Manager Thread       | 3 | Preemptive         | Event-driven        | Determine system mode transitions   | Incorrect spacecraft behavior
| Setup Mode Thread         | 3 | One-shot (startup) | Boot only           | Validate UID, check PA6, init CAN, read sensors     | Incorrect redundancy behavior
| Mission Logic Thread      | 3 | Periodic (1–10 s)  | GNSS or RTC-driven  | Evaluate pass windows, trigger experiments          | Missed imaging opportunity
| SOH Thread                | 5 | Periodic (1–5 s)   | Timer-based         | Poll sensors, compile telemetry         | Incomplete telemetry
| Downlink Scheduler Thread | 3 | Event + Periodic   | Pass window         | Schedule and queue telemetry for COMMS  | Lost downlink opportunity
| Ground Command Thread     | 3 | Event-driven       | CAN RX message      | Parse and execute commands              | Command execution failure
| Error Handling Thread     | 1 | Event-driven       | Fault trigger       | Escalate faults, enter error mode       | Faults not mitigated



## 14. Execution Model Diagram (Conceptual) 

### Interrupt Level 

→ CAN RX ISR 

→ Hardware Faults 

→ Internal Watchdog 

### Thread Level (Preemptive Scheduler) 

**Priority 0**

    - Watchdog Thread 

**Priority 1**

    - CAN TX 
    - Error Handler 

**Priority 3**

    - Mode Manager 
    - Mission Logic 
    - Ground Command 
    - Setup Mode (startup only) 
    - Downlink Scheduler 

**Priority 5**

    - SOH Collection 

 

## 15. Thread Timing Characteristics 

### Hard Real-Time Threads 

Must never block or sleep excessively: 

    - Watchdog Thread 
    - CAN RX ISR 

### Soft Real-Time Threads 

Timing important but tolerates minor jitter: 

    - Mission Logic 
    - Downlink Scheduler 
    - Mode Manager 

### Background Threads 

Can tolerate delays: 

    - SOH Thread 

 

## 16. Recommended Stack Sizes (Initial Estimates) 

| Thread        | Suggested Stack Size |
|---------------|----------------------|
| Watchdog      | 512 B
| CAN TX        | 1024 B
| Mode Manager  | 1024 B
| Mission Logic | 2048 B
| SOH           | 1024 B
| Setup Mode    | 1024 B

Actual stack usage must be verified with: 

`CONFIG_THREAD_ANALYZER=y`
 

 

## 17. Thread Communication Mechanisms 

| Mechanism     | Usage |
|---------------|-------|
| k_msgq        | CAN packet passing
| k_event       | Mode transitions
| k_mutex       | Shared SOH structures
| k_timer       | Periodic tasks
| ISR callbacks | CAN reception

 

## 18. Determinism Strategy 

To ensure timing integrity: 

    - No busy loops 
    - No blocking calls in high-priority threads 
    - Minimal logging in critical threads 
    - All periodic work uses timers 
    - ISR does minimal work (enqueue only) 

 

## 19. Cold Spare Considerations 

Both MCUs run identical thread tables. 

Differences: 

    - PA6 determines role 
    - Only active MCU transmits CAN commands 
    - Cold spare may: 
        - Monitor 
        - Avoid commanding 
        - Maintain synchronized SOH 

This allows seamless takeover if hardware switching occurs. 

 

## 20. Summary 

The thread structure ensures: 

    - Deterministic watchdog servicing 
    - Reliable CAN communication 
    - Modular subsystem control 
    - Scalable mission logic 
    - Fault containment 

The design balances: 

    - Real-time requirements 
    - Redundancy validation 
    - Maintainability 
    - CubeSat resource constraints 

 
