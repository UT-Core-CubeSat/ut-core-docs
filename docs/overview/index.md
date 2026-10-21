---
sidebar_position: 1
title: Architecture Overview
hide_table_of_contents: true
---

import SystemArchitecture from '@site/src/components/SystemArchitecture';

# Architecture Overview

UT-CORE’s onboard architecture is organized into boards that share one CAN bus. COMMS links the spacecraft to the ground station over UHF and S-band, and GNSS receives satellite signals. Click a board or the CAN bus to open its page, which covers that board’s functionality and messages in detail.

<SystemArchitecture />

## Subsystems

- **[Command & Data Handling (CDH)](/overview/cdh)**: central coordination, sequencing, and data handling
- **[Electrical Power System (EPS)](/overview/eps)**: power generation, storage, regulation, and distribution
- **[Attitude Determination & Control (ADCS)](/overview/adcs)**: attitude estimation and control
- **[Communications (COMMS)](/overview/comms)**: uplink/downlink and ground interface
- **[GNSS](/overview/gnss)**: position and time
- **[Motor board](/hardware/boards/motor)** and **[Solar conglomerator](/hardware/boards/solar)**: reaction wheel and magnetorquer drivers, commanded by ADCS
- **[CAN interface](/interfaces/can)**: the shared bus every board talks over

The diagram’s content lives in `src/components/SystemArchitecture/data.js`. To point a block at a new page, change its entry in `LINKS`.
