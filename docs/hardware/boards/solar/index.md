---
sidebar_position: 0
title: Solar Conglomerator
---

{/*
<span style={{color: 'red'}}> This text is red </span>
<span style={{color: 'green'}}> This text is green </span>
*/}

import Solar_img_1 from './img/Solar_img_1.png';
import Solar_img_2 from './img/Solar_img_2.png';
import Solar_img_3 from './img/Solar_img_3.png';


# Solar Conglomerator

<img src={Solar_img_1} style={{width: '512px'}} />

## See Also

- [EPS Overview](/overview/eps)
- [Solar Conglomerator Software](/software/solar)
- [MCU Block](/hardware/mcu)


## Documentation

This document is to go through my thoughts on the current design for the Electrical Power System (EPS) of the CubeSat specifically for solar conglomerator board.

I will highlight working things in
<span style={{color: 'green'}}> green </span>
and broken in
<span style={{color: 'red'}}> red </span>

The idea behind the solar conglomerator is mainly to create a way to control the magnetorquers on the solar boards. It also acts as a place where all the solar boards can come to a common node allowing for a voltage to go to the batteries to charge. The board has triple modular redundancy and has two MCU’s. This is very similar to the CDH board but does one more function of running the magnetorquers.

There isn’t much to say about this board if you already know what is going on with the CDH board. As I have said before, this board only runs the magnetorquers via a switch on the low side of the magnetorquers. 

Now this did not work at first, as you can tell this is a BJT rather than a transistor. This was a mistake. I have since updated it to the same transistor that we used successfully on the battery heaters. So they should work now, but for the BJT we had to add a 1k resistor for the base. That should no longer be an issue since it has been changed to a transistor.

<img src={Solar_img_2} style={{width: '256px'}} />
*Image 2: Low side switch of magnetorquer 1*

And there is a 20-pin connector for the solar board to connect to the solar conglomerator. For each of the 4 panels.

<img src={Solar_img_3} style={{width: '256px'}} />
*Image 3: 20 pin connectors for the solar panels*

And of course, there is extra MUX on the board because you need to be able to control the magnetorquers from either MCU 1 or 2.

<span style={{color: 'red'}}>
Okay, so after testing, there are some changes that must be made. I have made changes in schematics and PCB, but we need to order it and test it. The changes were 

    1. The pins for the magnetorquers low side switches were connected to the wrong pins on the MCU. That has been corrected on the schematic and PCB. 
    2. The switches I had originally were BJT’s, but I did not have bleed resistors with them. Or any capacitors with them, so it made it bad for square waves. I changed it to a MOSFET, the same one I have for the battery heaters.

Those were the changes that needed to be made, I have already updated the schematic and PCB.
</span>


## Full Schematic

![Solar Schematic](./img/Solar_Conglomerator.svg)


## Pin Mappings

Pin mappings not yet documented. See schematic or [MCU Block](/hardware/mcu).


*(See original document for author contact info.)*
