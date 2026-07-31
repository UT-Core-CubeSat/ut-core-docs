---
sidebar_position: 0
title: MCU Block
---

{/*
<span style={{color: 'red'}}>This text is red</span>
<span style={{color: 'green'}}>This text is green</span>
*/}


import MCU_img_1 from './img/MCU_img_1.png';
import MCU_img_2 from './img/MCU_img_2.png';
import MCU_img_3 from './img/MCU_img_3.png';
import MCU_img_4 from './img/MCU_img_4.png';
import MCU_img_5 from './img/MCU_img_5.png';
import MCU_img_6 from './img/MCU_img_6.png';
import MCU_img_7 from './img/MCU_img_7.png';
import MCU_img_8 from './img/MCU_img_8.png';
import MCU_img_9 from './img/MCU_img_9.png';
import MCU_img_10 from './img/MCU_img_10.png';


# MCU Block

## Introduction

In this document I am going to attempt to convey my design decision and functionality descriptions of the MCU Block that is found universally across the UT-CORE CubeSat electrical design. It is designed to be modular in the hope that modifications are easy to make. If you ever find yourself confused and cannot determine the reason for design decisions, please do not hesitate to reach out to me. I want to see this project succeed and fly at some point and any assistance I can provide I will do so gladly.

What is to follow is essentially an edited word vomit on how everything works in the MCU Block. Mistakes that need to be corrected as of 4/21/2026 will be noted in
<span style={{color: 'red'}}> red. </span>
Space explanations for why things are the way they are will be in
<span style={{color: 'green'}}> green. </span>


## Full Schematic

![CDH Schematic](./img/MCU_Block_100pin.svg)


## STM32U5Axxx Family

To begin we need to discuss the ST chip that we selected. It is an ultra-low power MCU chip that allows for some of the densest GPIO to package size that we have found.
<u>Do note when ordering these chips that they have an exceptionally long lead time due to popularity and if ordering from JLCPCB you need to get the chips preordered 1-2 months in advance.</u>
Additionally, the GPIO pins of this chip are very specific. Not even the timers for driving PWM are the same pin to pin from timer to timer. Explicit understanding of what you need the pin to do to downstream and what that pin is capable of is essential. Most of the mistakes we made were from NOT doing this.


## MCU Power:

### 64 Pin Package

<img src={MCU_img_1} style={{width: '512px', margin: '1rem'}} />

### 100 Pin Package

<img src={MCU_img_2} style={{width: '512px', margin: '1rem'}} />

The STM32U5x chips are powered by 3.3 volts. They have an analog Voltage reference that needs to be filtered through a ferrite bead and have a decoupling capacitive network seen on the right of these images to smooth out voltage ripples. 

This system is fed by a
<span style={{color: 'red'}}> TPS2552DRVT </span>
chip.
<span style={{color: 'red'}}> The chip is wrong on the existing prototype boards as of 4/20/2026. We need the TPS2553DRVT chip! It just changes the enable pin to the correct direction. Braydon sliced the existing boards with a razor blade to get the existing boards working. </span>
This is a TI chip that prevents over current once above a certain limit set by the ILIM resistor (check data sheet for current value) and auto resets based upon a RC timer set by the fault resistor and the retry capacitor. 
<span style={{color: 'green'}}> In space there is something called a total ionizing dose that will cause MOSFETS to lock open or closed. This can cause an over current condition and can destroy the chip. By limiting, resetting it, and draining the power this type of fault should be cleared in an ideal case. </span>

This current limiter is found in front of a few other chips on the board, but I will just note its existence in those cases. They just have different current limiter resistors based on the chips they are attached to.

Each MCU is attached to a separate 3.3 volt rail. This allows each to be powered independently and affects some MUX control I will discuss in that section.


## CAN Transceiver

<img src={MCU_img_3} style={{width: '700px', margin: '1rem'}} />

**We are using the TCAN3403!  The schematic has this labeled wrong, but the pinout and connections are correct as of the 0.6 version of the CDH!**

Note that to communicate with CAN you need both the transceiver and controller. The controller is in the MCU, and the transceiver is an external chip. I have placed a current limit in this circuit for protection of the can controller. Also note that the fault pin out of the limiter is going to one of the GPIO pins on the MCU this is so that the MCU can reset the can controller it is attached to if the controller gets locked up. The CANH and CANL pins just go to the backplane to connect with every other board.


## Watchdog

<img src={MCU_img_4} style={{width: '512px', margin: '1rem'}} />

The watchdog chip is not my favorite solution to such a critical reliability component as it relies on MOSFETs. 
<span style={{color: 'green'}}> MOSFETs are suspectable to total ionizing doses causing latch up as mentioned earlier. </span>
If this gets stuck it causes issues that if for example it was on the EPS board then what recovers it?
<span style={{color: 'red'}}> If you check the 100 Pin MCU example it still has what was an analog solution attempt at creating a square wave oscillator with a missed edge detector front end as seen below. Ultimately this circuit was a failure and can be found on the purple development boards. </span>
The function of the watchdog IC is that the MCU must “pet” it by pulsing the WDI pin often enough. If not, it pulls WDO low and 
<span style={{color: 'red'}}> is supposed to pull NSRT low. This connection is missing. This should be corrected in the most recent schematic. As of 4/20/2026 it was tested with a jumper wire from the pink connection the image above to the NRST and it functions as expected. I just missed the connection. </span>
 
The goal with this chip is that if the MCU gets locked up in a way that does not trip the current limiter it will automatically reset it to hopefully recover from whatever error it ran into.


## Temperature Sensors

<img src={MCU_img_5} style={{width: '256px', float: 'right', margin: '1rem'}} />

These chips are simple. They connect to the I2C bus and can be placed under critical components such as the MCUs, FRAM, or any other critical component to monitor the temperature. They each need a unique address which is assigned using the A0, A1, and A2 pins. This can be scaled up or down based upon how many temperatures you want as telemetry.
<span style={{color: 'green'}}> This is useful in space as all the chips will have minimum and maximum temperatures and if we are approaching a limit we need to know to shut down that component automatically in the code or have some way to cool it down. It’s to prevent breakage of the components on board. </span>


## MUX

<img src={MCU_img_6} style={{width: '256px', float: 'left', margin: '1rem'}} />

How do you have two MCUs touch the same components on the board you ask? A LOW IMPEDANCE HIGH-SPEED DUPLEXING MUX OF COURSE!!!

This functions rather simply. If MCU2 is powered, then the mux select pin is powered and the pins are swapped so that MCU2 has control. If MCU2 is unpowered then MCU1 has control. This is done through the little diode network in the top right corner of the image to the left. In the top left corner, you’ll see how the power is allowed to flow into the downstream components without backflowing if both MCUs are powered. This prevents power domain 1 or 2 from powering the other domain. Because this is so essential the diodes selected are rather overkill but necessarily so.

The mux’s themselves are rather simple they 1:2 so the downstream component gets the single channel side and each MCU gets A or B respectively for the upstream side. There is also the MR pin that allows for either MCU to pull the line low and reset the mux in the event of a latch up condition. If you need more GPIO pins you need more muxes. This is by far the most space constraining part of the boards as these chips are not small. This part of the design works almost flawlessly so I wouldn’t change it without an extremely strong reason.


## FRAM

<img src={MCU_img_7} style={{width: '512px', margin: '1rem'}} />

<span style={{color: 'green'}}> In space through solar radiation bits just flip at random. To mitigate that there are three of these on each board to store a golden copy of the code. For mor information on how this works refer to the software team’s documentation. </span>
Beyond this chip having a current limiter and communicating via SPI there isn’t much more to say about it other than I think this manufacturer sucks.
<span style={{color: 'red'}}> Consider finding a different manufacturer for this chip as the one that built this is probably bad. Software had a lot of trouble getting SPI to function correctly. We don’t think the issue is being caused by the MUX as it is designed for high speed signaling and calls out SPI as being compatible with it. It may be a trace thickness issue. Further testing is needed here. </span>


## AND Lock/UART Reprogram

### AND Lock Cicuit

<img src={MCU_img_8} style={{width: '256px', margin: '1rem'}} />

### AND Lock pinouts

<img src={MCU_img_9} style={{width: '256px', margin: '1rem'}} />

Okay boys and girls buckle in cause this circuit is a fever dream. How the heck do we allow for one chip to reset the other one if we don’t know if the one trying to reset the other is still healthy? Enter the “AND Lock” a product of caffeine and many… many hours of thought.

The idea behind this lovely analog circuit is that we need to trust the MCU before we allow it to adjust the boot pin and reset pin of the other MCU.
<span style={{color: 'green'}}> As we discussed earlier in this document MCUs are susceptible to latch up so its all great to connect the reset and boot pin from one MCU to the other; but, what happens if that first MCU gets latched up and cant recover and it just so happens that it latches up in a way that pulls the other chip low! Now that subsystem is dead forever potentially! NOT GOOD! </span>
This circuit is inspired by the concept of launch keys in that you need two. The idea is that in order for MCU1 to touch MCU2 or vice versa three total pins must be in the correct position. There are two lock pins LCK#_1/LCK#_2 that must both be drive high in order for the LCK1_IN and LCK2_IN to be able to touch the critical pins of the other MCU. This esentially becomes an AND truth table. It is designed such that the input pin and the two lock pins are all on different functional blocks of the MCU so that ideally in the event that the MCU fails they don’t all fail the same way and prevents a bad out come from occuring.

<span style={{color: 'red'}}> Please note that in the images above I accidentally fed the and lock back into PH0 (boot pin) and NSRT of the same chip instead of the other one. Therefore the AND Lock is not functional on the blue dev boards. I will correct this in the schematic so that they are hooked up correctly. </span>

<img src={MCU_img_10} style={{width: '170px', float: 'left', margin: '1rem'}} />

That leads me to why do we need this functionality?
<span style={{color: 'green'}}> In space we also have the issue of code can just become corrupted in flight from radiation and bit flip. </span>
To recover from this, we need to be able to allow one MCU to reprogram or rewrite the code to the other. Functionally, it’s on software to get the code working but electrically we just need a UART connection, as seen on the left, and the boot pin and the reset pin. So, between the AND lock and this UART connection between the MCUs, in theory we can do in-flight recovery of a failed MCU. This is considered a last resort condition, and while it could also be used for in-flight software updates I would strongly recommend against using it for that purpose.


*(Document written by Sean Gillam. See original document for contact info.)*
