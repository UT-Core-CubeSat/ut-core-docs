---
sidebar_position: 0
title: Motor Board
---

{/*
<span style={{color: 'red'}}>This text is red</span>
<span style={{color: 'green'}}>This text is green</span>
*/}


import MOTOR_3D from './img/MOTOR_3D.png';
import MOTOR_img_1 from './img/MOTOR_img_1.png';
import MOTOR_img_2 from './img/MOTOR_img_2.png';
import MOTOR_img_3 from './img/MOTOR_img_3.png';
import MOTOR_img_4 from './img/MOTOR_img_4.png';
import MOTOR_img_5 from './img/MOTOR_img_5.png';


# Motor Board

<img src={MOTOR_3D} style={{width: '512px'}} />


## See Also

- [ADCS Overview](/overview/adcs)
- [ADCS Software](/software#eps)


## System Overview:

<span style={{color: 'red'}}> \***This board has some mistakes that I did not have time to fix. See** [possible solutions](#mcu-pin-count-possible-solutions)\* </span>

The Motor Board is responsible for executing torque commands from the Attitude Determination and Control System (ADCS) by driving four reaction wheel motors. The reaction wheels are basically just a fly wheel. As you apply a torque to the motor, newton’s second law will rotate the satellite in the opposite direction. That is how you control the orientation of the satellite. In the case the satellite is tumbling, and the motors saturate you can use the magnetorquers and momentum dump. Basically, the magnetorquers will give you energy efficient rough control and the motors can fine tune orientation from there. We attempted to do full field orientation control (FOC) on the motors, which had its pros and cons I will talk about when I go over fixes to this board.

The board integrates the central command and data handling microcontroller (MCU block 100 pin package) along with four motor driver circuits based on the L6234PD013TR. Each motor is driven by a three-phase configuration, with the driver providing three half-bridges (one per phase).

For current feedback, each motor uses two current-sensing op-amps, with the third phase current calculated in software. Rotor position feedback is provided via Hall sensors, enabling closed-loop motor control and fault detection. The current motors are discrete hall sensors which is completely fine but to do true FOC you might want to look into getting the encoder or analog hall sensor package.

To ensure safe operation, each motor channel includes an independent eFuse for overcurrent protection. These eFuses automatically disconnect a motor in the event of a fault (such as MOSFET lock up) and can also be controlled by the MCU to disable individual motors without shutting down the entire board.


## Motor “32BF 8B K .10”

<img src={MOTOR_img_1} style={{width: '256px', float: 'right', margin: '1rem'}} />

The 32BF 8B K 0.10 is the 3-phase brushless DC motor used to drive each reaction wheel. It is a three-phase motor with integrated discrete Hall sensors that provide rotor position feedback to the MCU for commutation and closed-loop control. The motor converts electrical input from the driver into rotational motion of the flywheel, enabling precise torque generation for satellite attitude control. The Hall sensors allow reliable startup and low-speed operation, which is important for controlled spin-up and stabilization. This motor was selected for its compatibility with the driver, compact form factor, and ability to support sensor-based control methods. 
One thing to insure is the JCLPCB mounts the motor connector with the conductor facing the inside of the board. Our first board came back flipped. And that’s why the motors are cut.


## Driver “L6234PD013TR”:

<img src={MOTOR_img_2} style={{width: '350px', float: 'right', margin: '1rem'}} />

The L6234 is the three-phase BLDC motor driver used for each reaction wheel. It integrates three half-bridges to drive the motor phases, which simplifies the design compared to a discrete solution. The MCU controls the driver using PWM signals on the IN pins to generate phase voltages, while the enable pins are tied together and controlled by a single GPIO for each motor. The sense pins are routed to external current-sensing op-amps to measure phase current, with two phases measured directly and the third calculated in software. This driver was chosen for its simplicity, compact footprint, and ability to support both basic commutation and more advanced control methods like FOC.


## Current sensing Amplifier: “INA240A2QDRQ1”:

<img src={MOTOR_img_3} style={{width: '256px', margin: '1rem', float: 'left'}} />

This device measures the phase current through shunt resistors (high precision/ low ohms resistor) and feeds that information back to the MCU. Accurate current measurement is critical for monitoring motor performance, detecting faults, and enabling closed loop control strategies. This part was selected because it is designed specifically for high common mode environments like motor drives and provides strong noise rejection, which is important given the switching noise from the driver. The voltage divider circuit on the right was used to supply Vref with 1.65v. Doing so makes it so the MCU can read + /- currents in both directions.

<img src={MOTOR_img_4} style={{width: '256px', margin: '1rem'}} />


## E-Fuse “TPS25940ARVCR”:

<img src={MOTOR_img_5} style={{float: 'right', margin: '1rem'}} />

The TPS25940 is used to provide electronic overcurrent and short-circuit protection for each motor power path. It functions as a resettable fuse, protecting both the motor driver and the satellite power system from fault conditions. Unlike a traditional fuse, it enables controlled current limiting, fast fault response, and automatic recovery, which is critical for a system that cannot be physically serviced after deployment. The device can also be controlled by the MCU to disable individual motors without shutting down the entire board.


## Mistakes in V2 that are fixed in V3:
 
    - Mux pin to each MCU were mixed up. <span style={{color: 'green'}}> Fixed in V3 </span>
    - Button wiring. <span style={{color: 'green'}}> Fixed in V3 </span>
    - The shunt resistors were missing a GND connection. <span style={{color: 'green'}}> Fixed in V3 </span>
    - When ordering the board make sure motor connectors have their pads on the inside of the board. JCLPCB soldered them on backwards


## Problems that still need to be addressed:

<span style={{color: 'red'}}>
    - The TPS25940 eFuse overheated during motor operation, likely because motor startup/stall current forced the eFuse into current limiting. In current limit, the eFuse drops voltage across itself and dissipates heat, which can cause thermal shutdown or physical failure if the current demand and PCB thermal layout are not sufficient. A new effuse needs to be added. Maybe the TPS25982
    - The big problem is the enable pins for each driver. As you can see on Kicad the motor board is a dense board. It uses the 100pin MCU and the board uses almost all of them. I originally thought that I could tie the enable pins together for each driver but that is wrong. The MCU has to actively set 1 enable high, 1 low and 1 floating. In order to fix this all enable pins need their own GPIO pin on the MCU. The problem is there is not enough. So I have listed a few options/ fixes below. 
        - This mistake was made by trying to force FOC control for 4 motors on the 100 pin package. Ideally the motors have FOC for better control but I don’t know if that is realistic. The MCU was having a hard time processing all that data and to keep it you’ll have to get a bigger MCU. I don’t know if that is realistic considering how dense this board already is.
</span>


## MCU Pin Count Possible solutions: 

### Option 1: Keep FOC and Driver Circuit as Is

If you decide that FOC is a necessity and you have enough room on the board, one option is to use an additional MCU with more pins.

**Pros:**
    - Maintains FOC capability 
    - Driver circuit requires little to no change

**Cons:**
    - Difficult to find space for larger  MCUs and more multiplexers
    - Requires full PCB redesign due to layout changes 

### Option 2: 1 PWM, DIR Driver

Example: DRV10970

**What it does:**
    - Runs from 5 V to 18 V 
    - Designed for 12 V nominal systems 
    - Supports 1.5 A peak output phase/winding current 
    - Takes PWM as speed command and FR as direction 

**Pros:**
    - Solves enable pin issue 
    - Reduces MCU pin usage and computational load

**Cons:**
    - Loss of FOC control

### Option 3: 3 PWM Driver, No Separate Enable Pins

Example: DRV8311.
<span style={{color: 'green'}}> (Best if you can insure it will interface and work as I describe) </span>

**What it does:**
    - Runs from 3 V to 20 V (supports 12 V rails) 
    - Supports 5 A peak current drive 
    - Supports 3x PWM or 6x PWM control 
    - Includes three integrated current sense amplifiers 
    - Handles dead time internally 

**Pros:**
    - Supports FOC and advanced control methods 
    - Eliminates need for external current sensing and complex enable control

**Cons:**
    - Requires driver replacement and PCB redesign 
    - Firmware changes required

<span style={{color: 'red'}}> \*Make sure to check all of these options, don’t take my word for it\* </span>


## Full Schematic

### Motor Board Schematic
![Motor Board Schematic](./img/Motor_Board_V3.svg)

### MUX Schematic
![MUX Schematic](./img/Motor_Board_V3-mux.svg)

### MCU Block Schematic
![MCU Block Schematic](./img/Motor_Board_V3-mux-MCU_block.svg)


## Pin Mappings

| PIN #     |     PIN NAME          | DESCRIPTION |
|-----------|-----------------------|-------------|
| PIN 1     |   Motor 3 Fault       | Digital input efuse for motor 3 tripped. Error = Low
| PIN 2     |   Motor 4 Fault       | Digital input efuse for motor 4 tripped. Error = Low
| PIN 3     |   Motor 1 Kill        | Digital output kill switch for motor 1. Kill power = Low
| PIN 4     |   Motor 2 Kill        | Digital output kill switch for motor 2 Kill power = Low
| PIN 5     |   Motor 3 Kill        | Digital output kill switch for motor 3. Kill power = Low
| PIN 6     |   VBAT                | 
| PIN 7     |   LED 1               | 
| PIN 8     |   Crystal Oscillator  | 
| PIN 9     |   Crystal Oscillator  | 
| PIN 10    |   VSS                 | 
| PIN 11    |   VDD                 | 
| PIN 12    |   N/C                 | 
| PIN 13    |   N/C                 | 
| PIN 14    |   NRST                | 
| PIN 15    |   Motor 1, Phase A    | Analog Input for current in motor 1 phase A.( 0-3.3 V. 1.65V = 0A)
| PIN 16    |   Motor 1, Phase B    | Analog Input for current in motor 1 phase B.( 0-3.3 V. 1.65V = 0A)
| PIN 17    |   Motor 2, Phase A    | Analog Input for current in motor 2 phase A.( 0-3.3 V. 1.65V = 0A)
| PIN 18    |   Motor 2, Phase B    | Analog Input for current in motor 2 phase B.( 0-3.3 V. 1.65V = 0A)
| PIN 19    |   VSSA                | 
| PIN 20    |   VREF -              |
| PIN 21    |   VREF +              |
| PIN 22    |   VDDA                |
| PIN 23    |   FRAM3_F             |
| PIN 24    |   FRAM2_F             |
| PIN 25    |   USART2_1            |
| PIN 26    |   USART2_2            |
| PIN 27    |   GND                 |
| PIN 28    |   VDD                 |
| PIN 29    |   FRAM1_F             |
| PIN 30    |   MCU_MR              |
| PIN 31    |   Motor 4 Phase A     | Analog Input for current in motor 4 phase A.( 0-3.3 V. 1.65V = 0A)
| PIN 32    |   Motor 4 Phase B     | Analog Input for current in motor 4 phase B.( 0-3.3 V. 1.65V = 0A)
| PIN 33    |   Motor 3, Phase A    | Analog Input for current in motor 3 phase A.( 0-3.3 V. 1.65V = 0A)
| PIN 34    |   Motor 3, Phase B    | Analog Input for current in motor 3 phase B.( 0-3.3 V. 1.65V = 0A)
| PIN 35    |   Motor 2 PWM C       | Digital output PWM for Motor 2 Phase C (TIM3_CH3)
| PIN 36    |   Motor 2 PWM B       | Digital output PWM for Motor 2 Phase B (TIM3_CH4)
| PIN 37    |   WD                  | watch dog WDI
| PIN 38    |   Motor 4 Kill        | Digital output kill switch for motor 4. Kill power = Low
| PIN 39    |   Motor 4 Hall A      | Digital input for Motor 4, hall sensor A
| PIN 40    |   Motor 4 Hall B      | Digital input for Motor 4, hall sensor B
| PIN 41    |   Motor 4 Hall C      | Digital input for Motor 4, hall sensor C
| PIN 42    |   Motor 4 PWM C       | Digital output PWM for Motor 4 Phase C (TIM1_CH2)
| PIN 43    |   N/C                 |
| PIN 44    |   Motor 4 PWM A       | Digital output PWM for Motor 4 Phase A (TIM1_CH3)
| PIN 45    |   Motor 4 PWM B       | Digital output PWM for Motor 4 Phase B (TIM1_CH4)
| PIN 46    |   VREF/GND            | MCU 1 is conncected to VREF, MCU 2 is GND to tell which MCU is active.
| PIN 47    |   CS1                 |
| PIN 48    |   VCAP                |
| PIN 49    |   GND                 |
| PIN 50    |   VDD                 |
| PIN 51    |   WP1                 |
| PIN 52    |   SPI2_SCK            | SPI clock for FRAM
| PIN 53    |   SPI2_MISO           | SPI MISO for FRAM
| PIN 54    |   SPI2_MOSI           | SPI MOSI for FRAM
| PIN 55    |   Motor 3 Hall B      | Digital input for Motor 3, hall sensor B
| PIN 56    |   Motor 3 Hall C      | Digital input for Motor 3, hall sensor C
| PIN 57    |   Motor 4 Enable      | Digital output to enable all gates on driver. Enabled = High
| PIN 58    |   Motor 3 Enable      | Digital output to enable all gates on driver. Enabled = High
| PIN 59    |   Motor 1 PWM A       | Digital output PWM for Motor 1 Phase A (TIM4_CH1)
| PIN 60    |   Motor 1 PWM B       | Digital output PWM for Motor 1 Phase B (TIM4_CH2)
| PIN 61    |   Motor 1 PWM C       | Digital output PWM for Motor 1 Phase C (TIM4_CH3)
| PIN 62    |   LED 2               |
| PIN 63    |   Motor 3 PWM A       | Digital output PWM for Motor 3 Phase A (TIM8_CH1)
| PIN 64    |   Motor 3 PWM B       | Digital output PWM for Motor 3 Phase B (TIM8_CH2)
| PIN 65    |   Motor 3 PWM C       | Digital output PWM for Motor 3 Phase C (TIM8_CH3)
| PIN 66    |   Motor 1 Enable      | Digital output to enable all gates on driver. Enabled = High
| PIN 67    |   PA6_1               | AND lock 1 IN
| PIN 68    |   PA9_1               |
| PIN 69    |   CS3                 |
| PIN 70    |   PA11                | CAN transeiver RXD
| PIN 71    |   PA12                | CAN transeiver TXD
| PIN 72    |   PA13                | SIO
| PIN 73    |   VDDUSB              |
| PIN 74    |   GND                 |
| PIN 75    |   VDD                 |
| PIN 76    |   PA14                | CLK
| PIN 77    |   PA7                 | AND lock 2 IN
| PIN 78    |   2 pin header        |
| PIN 79    |   2 pin header        |
| PIN 80    |   Motor 2 Enable      | Digital output to enable all gates on driver. Enabled = High
| PIN 81    |   Motor 1 Hall A      | Digital input for Motor 1, hall sensor A
| PIN 82    |   Motor 1 Hall B      | Digital input for Motor 1, hall sensor B
| PIN 83    |   PD2                 | AND lock 1
| PIN 84    |   Motor 1 Hall C      | Digital input for Motor 1, hall sensor C
| PIN 85    |   Motor 2 Hall A      | Digital input for Motor 2,  hall sensor A
| PIN 86    |   Motor 2 Hall B      | Digital input for Motor 2, hall sensor B
| PIN 87    |   Motor 2 Hall C      | Digital input for Motor 2, hall sensor C
| PIN 88    |   Motor 3 Hall A      | Digital input for Motor 3,  hall sensor A
| PIN 89    |   B0                  | AND lock1 IN
| PIN 90    |   Motor 2 PWM A       | Digital output PWM for Motor 2 Phase A (TIM3_CH1)
| PIN 91    |   WP3                 |
| PIN 92    |   I2C_SCL             | SCl for temp sensors I2C
| PIN 93    |   I2C_SDA             | SDA for temp sensors I2C
| PIN 94    |   PH3                 | AND lock 1 OUT
| PIN 95    |   CS2                 |
| PIN 96    |   WP2                 |
| PIN 97    |   Motor 1 Fault       |Digital input efuse for motor 1 tripped. Error = Low
| PIN 98    |   Motor 2 Fault       |Digital input efuse for motor 2 tripped. Error = Low
| PIN 99    |   GND                 |
| PIN 100   |   VDD                 |



*(Document written by Tyler Dalton. See original document for contact information)*
