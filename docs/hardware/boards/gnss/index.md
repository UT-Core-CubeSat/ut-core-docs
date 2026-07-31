---
sidebar_position: 0
title: GNSS Board
---

{/*
<span style={{color: 'red'}}>This text is red</span>
<span style={{color: 'green'}}>This text is green</span>
*/}

import GNSS_3D from './img/GNSS_3D.png';


# GNSS Board

<img src={GNSS_3D} style={{width: '512px'}} />


## See Also

- [GNSS Overview](/overview/gnss)
- [GNSS Software](/software#gnss)
- [MCU Block](/hardware/mcu)


## Introduction

In this document I am going to attempt to convey my design decision and functionality descriptions of the GNSS board. This boards main functionality is to determine its location in space for the purpose of propagating orbits and insuring your location above the earth for some imaging missions. If you ever find yourself confused and cannot determine the reason for design decisions, please do not hesitate to reach out to me. I want to see this project succeed and fly at some point and any assistance I can provide I will do so gladly.

What is to follow is essentially an edited word vomit on how everything works in the CDH subsystem. Mistakes that need to be corrected as of 4/21/2026 will be noted in
<span style={{color: 'red'}}> red. </span>
Space explanations for why things are the way they are will be in
<span style={{color: 'green'}}> green. </span>


## GNSS Module

This board doesn’t have much difference from the CDH board and essentially only supports the Orion B16 GNSS module. This chip is quite expensive at about one thousand dollars per each one. It communicates over UART through unique binary. That binary is listed in the datasheets that we have for the chip. The most important thing is that the Coaxial connector is 90-ohms impedance connector, and the trace also needs to maintain 90-ohms impedance. When ordering this board, we need to ensure that we select impedance control in the ordering options.
<span style={{color: 'red'}}> The only issues with this board are the same issues that the MCU block has. </span>


## Full Schematic

![GNSS Schematic](./img/gnss_v0.2.svg)

## Pin Mappings

Pin mappings not yet documented. See schematic or [MCU Block](/hardware/mcu).

*(Document written by Sean Gilliam. See original document for contact info.)*
