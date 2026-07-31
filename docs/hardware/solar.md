---
sidebar_position: 2
title: Solar Boards
---


{/*
<span style={{color: 'red'}}> This text is red </span>
<span style={{color: 'green'}}> This text is green </span>
*/}

import Solar_img_1 from './img/Solar_img_1.png';
import Solar_img_2 from './img/Solar_img_2.png';
import Solar_img_3 from './img/Solar_img_3.png';
import Solar_img_4 from './img/Solar_img_4.png';
import Solar_img_5 from './img/Solar_img_5.png';
import Solar_img_6 from './img/Solar_img_6.png';
import Solar_img_7 from './img/Solar_img_7.png';


# Solar Boards


## See Also

- [EPS Board](/hardware/boards/eps)
- [Solar Conglomerator](/hardware/boards/solar)


## Introduction

This document is to go through my thoughts on the current design for the Electrical Power System (EPS) of the CubeSat specifically for solar panel boards.

I will highlight working things in
<span style={{color: 'green'}}> green </span>
and broken in
<span style={{color: 'red'}}> red </span>

Overall idea: The solar cells will be in series to have a voltage of 19.25Voc, and a current of about 0.5A. This is because the battery pack is 4S2P (4 in series, and two in parallel) which is a voltage of 14.8, and a full charge of 16V, so we must be able to charge the battery with a higher potential of 19.25V. There are temperature sensors along the board, and a voltage and current sensor on the output of the solar cells, and a 3.3V regulator that can be used rather than the battery providing a chance to use instantaneous voltage rather than stored from the battery. 


## Solar Board

The solar boards are straightforward. The panels are on one side of the board

<img src={Solar_img_1} style={{width: '512px'}} />
*Image 1: Solar cells on the PCB board.*

The magnetorquer is inside the panel on level 2 and 3. The specific layout of the wires is to create the most optimal magnetic field. This will be fed with a 12V PWM signal to control the size of the magnetic field.

<img src={Solar_img_2} style={{width: '512px'}} />
*Image 2: magnetorquers on level 2 and 3 of the board*

There is a current voltage sensor on this board that monitors the power output of solar cells and communicates the values to the solar conglomerator MCU via I2C.

<img src={Solar_img_3} style={{width: '512px'}} />
*Image 3: voltage and current sensor*

There is a 3.3V regulator on the board that will give an instantaneous voltage off the solar cells that can be used in case the batteries are unavailable.  

<img src={Solar_img_4} style={{width: '512px'}} />
*Image 4: 3.3V regulator*

Now this is for the X+ side of the Cube Satellite, for the X-, Y+, and Y- the layout will be different due to the structure. 

Here is the X- panel, as you can see, there are only 4 solar cells because there is a GNSS antenna, and the star tracker camera. 

<img src={Solar_img_5} style={{width: '512px'}} />
*Image 5: X- Solar Board*

This and all other solar boards will have temperature sensors, voltage and current sensor, and a 3.3V regulator. 

This is the Y+ solar board

<img src={Solar_img_6} style={{width: '512px'}} />
*Image 6: Y+ Solar Board*

On this panel there will be a connector for the umbilical cord allowing for the charging of batteries before launching and testing other things during the testing phase. There is seven solar cells.

This is the Y- solar board

<img src={Solar_img_7} style={{width: '512px'}} />
*Image 7: Y- Solar Board*

The Y- solar panel has 7 solar cells, and the cut out is for the Remove Before Flight (RBF) tag.


<span style={{color: 'red'}}>
Okay, so what needs to be done with the solar panels?

A lot.... maybe...  So, I did not understand how solar cells work, as you can see there are 3 small tabs, and 1 big tab on top of each solar cell. The 3 small ones are GND, and the big one is power. It also so happens that the whole back of each solar cell is power, so bending the 3 small tabs shorts GND to power. So this will need to change from being behind the cell to above it. Now another thing we did put 7 cells on a solar panel, but we did not get the right voltage out of it. So my recommended next step would be to bread board all the solar cells together and see if you can get the right voltage out.

Another problem, when you put a load on the solar cell the voltage breaks down meaning that we aren’t getting the power out of the solar cells that we expect to. So I would also test that when you break board 7 cells together to make sure that you put a load on it and see if can handle a load and give the power we want.

We still need to test the other components on the solar panel, like the voltage and current sensors, and the 3.3V regulator.
</span>

<span style={{color: 'green'}}>
One thing that did work was the magnetorquers, but that is the only thing we were able to test successfully.
</span>


*(See original document for author contact information)*
