---
sidebar_position: 0
title: CDH Board
---

import CDH_3D    from './img/CDH_3D.png';
import CDH_img_1 from './img/CDH_img_1.png';
import CDH_img_2 from './img/CDH_img_2.png';
import CDH_img_3 from './img/CDH_img_3.png';
import CDH_img_4 from './img/CDH_img_4.png';
import CDH_img_5 from './img/CDH_img_5.png';


# CDH Board

<img src={CDH_3D} style={{width: '512px'}} />


## See Also

- [CDH Overview](/overview/cdh)
- [CDH Software](/software#cdh)
- [MCU Block](/hardware/mcu)


## Introduction

In this document I am going to attempt to convey my design decision and functionality descriptions of the CDH board. This boards main functionality is to collect telemetry data from all other subsystems in the satellite, collect and execute commands from ground, and essentially always know the status of the satellite. If you ever find yourself confused and cannot determine the reason for design decisions, please do not hesitate to reach out to me. I want to see this project succeed and fly at some point and any assistance I can provide I will do so gladly.

What is to follow is essentially an edited word vomit on how everything works in the CDH subsystem. Mistakes that need to be corrected as of 4/21/2026 will be noted in *\[italic\]*.


## EMMC

<img src={CDH_img_1} style={{width: '128px', float: 'left', margin: '1rem'}} />
In essence the CDH board is simply the MCU block plus a EMMC flash memory chip. Specifically, we want to use a single layer chip (SLC) NAND flash chip. SLC memory has much better endurance and radiation resistance in space. 
Unfortunately, SLC NAND flash is essentially obsolete and hard to find so the selected SANDISK chip is an eight gigabyte pSLC chip. The p in this case stands for pseudo as this is based on a multi-layer NAND flash that has been limited to a single layer. It is not as good but also the closest option. 

There isn’t much to say about the chip beyond all of the lines need to be length matched within a millimeter of each other as the signal timings are precise. \
*Unfortunately, there is an error on the existing CDH board. On the most recent blue prototype board the data lines are hooked to the wrong pins on the MCU. I didn’t realize at the time that there is something called the JEDEC protocol for communication with this type of chip. I believe software has tested banging on a line, but it is not the correct way to do this. This is not yet fixed in the schematic.*

<img src={CDH_img_2} style={{width: '256px', float: 'right', margin: '1rem'}} />
I wanted to briefly discuss working with a ball grid array on a PCB. They are kind of difficult to break out and there isn’t a lot of information on how to best do this. 

The standard settings in kicad will absolutely hate everything that is going on here. BGA are considered advanced fabrication so you have to add some custom rules in KiCAD to let it accept some of the vias and traces that are going on here

Below are some rules for the DRC. Just replace U16 with whatever chip needs to have a BGA breakout and it should allow for you to manuever inside the courtyard of that chip. Additionally, use a hole size of 0.15 mm, a diameter of 0.25 mm, and a trace width of 0.1016 mm. Please note this is the ABSOLUTE minimum fabrication capabilities of JLCPCB and lower than most american fabs that are in our price range.

Paste this into your DRC rules: 

```
(version 1)

(rule "U16_reduced_clearance"
  (constraint clearance (min 0.10mm))
  (condition "A.insideCourtyard('U16') || B.insideCourtyard('U16')")
)

(rule "U16_reduced_width"
  (constraint track_width (min 0.10mm))
  (condition "A.insideCourtyard('U16')")
)
```


## Full Schematic

![CDH Schematic](./img/command_data_handling_v0.6.svg)


## Pinout

### 40 Pin Connector:

<img src={CDH_img_3} style={{width: '512px'}} />

<img src={CDH_img_4} style={{width: '512px'}} />

| Pin # | Name     | Function |
|-------|----------|----------|
| 9     | CDH1_3V3 | CDH 1 3.3 Voltage
| 11    | CDH2_3V3 | CDH 2 3.3 Voltage
| 36    | GND      | System Ground
| 38    | CANL     | CAN Low
| 40    | CANH     | CAN High

### SWD:

<img src={CDH_img_5} style={{height: '256px'}} />

| Pin # | MCU Pin # | Name   | Function |
|-------|-----------|--------|----------|
| 1     | N/A       | GND    | System Ground
| 2     | N/A       | VREF   | Direct Connection to 3.3v Reference (Bypasses Safety)
| 3     | 49        | SWCLK  | System Clock
| 4     | 46        | SWDIO  | Data In/Out
| 5     | 7         | NRST   | Reset. Pull low to reset chip

### MCU Pinout:

| Pin # | MCU # | Name            | Function | Secondary Function |
|-------|-------|-----------------|----------|--------------------|
| 14    | PA0   | MCU#_FRAM3_F    | FRAM 3 Fault (IN \| Active HIGH)    | FRAM 3 Reset (OUT \| Active LOW)
| 15    | PA1   | MCU#_FRAM2_F    | FRAM 2 Fault (IN \| Active HIGH)    | FRAM 2 Reset (OUT \| Active LOW)
| 16    | PA2   | USART2_#        | UART Connection between boards    
| 17    | PA3   | USART2_#        | UART Connection between boards    
| 20    | PA4   | MCU#_FRAM1_F    | FRAM 1 Fault (IN \| Active HIGH)    | FRAM 1 Reset (OUT \| Active LOW)
| 21    | PA5   | MCU_MR          | Mux Reset (Active \| High)    
| 22    | PA6   | MCU_SEL         | MCU 2 if HIGH     
| 23    | PA7   | NC              |
| 41    | PA8   | CAN_F           | CAN Fault (IN \| Active HIGH)       | MCU# CAN Reset (OUT \| Active LOW)
| 42    | PA9   | S               | CAN Silent Mode (OUT \| Active HIGH)    
| 43    | PA10  | SHDN            | CAN Shutdown Mode (OUT \| Active HIGH)    
| 44    | PA11  | RXD             | CAN Receive (Data IN)    
| 45    | PA12  | TXD             | CAN Transmit (Data OUT)    
| 46    | PA13  | SWDIO           | Programing pin for SWD    
| 49    | PA14  | SWCLK           | Programing Pin SWD Clock    
| 50    | PA15  | NC              |
| 26    | PB0   | NC              |
| 27    | PB1   | NC              |
| 28    | PB2   | MCU#_WD         | Watchdog Pulse (OUT)    
| 55    | PB3   | MCU#_B0         | Boot zero recovery pin    
| 57    | PB5   | MCU#_WP3        | FRAM 3 Write Protection (OUT)    
| 56    | PB4   | MCU#_CS3        | FRAM 3 SPI Chip Select (OUT \| Active HIGH)    
| 58    | PB6   | MCU#_I2C1_SCL   | I2C1 SCL    
| 59    | PB7   | MCU#_I2C1_SDA   | I2C1 SDA    
| 61    | PB8   | MCU#_CS2        | FRAM 2 SPI Chip Select (OUT \| Active HIGH)    
| 62    | PB9   | MCU#_WP2        | FRAM 2 Write Protection (OUT)    
| 29    | PB10  | MCU#_CS1        | FRAM 1 SPI Chip Select (OUT \| Active HIGH)    
| 33    | PB12  | MCU#_WP1        | FRAM 1 Write Protection (OUT)    
| 34    | PB13  | MCU#_SPI2_SCK   | SPI2 SCK    
| 35    | PB14  | MCU#_SPI2_MISO  | SPI2 MISO    
| 36    | PB15  | MCU#_SPI2_MOSI  | SPI2 MOSI    
| 2     | PC13  | LED D3          | Diag LED 3    
| 3     | PC14  | LED D2          | Diag LED 2    
| 4     | PC15  | LED D1          | Diag LED 1    
| 5     | PH0   | LCK1_2          | AND_Lock Key 1 (OUT \| Active HIGH)    
| 6     | PH1   | LCK2_IN         | Reset opposite MCU (OUT \| Active HIGH Pulse)    
| 60    | PH3   | LCK1_OUT        | BOOT 0 Input Pin    
| 54    | PD2   | LCK1_1          | AND_Lock Key 2 (OUT \| Active HIGH)    




*(Document written by Sean Gillam. See original document for contact info.)*
