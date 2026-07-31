---
sidebar_position: 0
title: EPS Board
---

{/*
<span style={{color: 'red'}}>This text is red</span>
<span style={{color: 'green'}}>This text is green</span>
*/}


import EPS_3D from './img/EPS_3D.png';
import EPS_img_2 from './img/EPS_img_2.png';
import EPS_img_3 from './img/EPS_img_3.png';
import EPS_img_4 from './img/EPS_img_4.png';
import EPS_img_5 from './img/EPS_img_5.png';
import EPS_img_6 from './img/EPS_img_6.png';
import EPS_img_7 from './img/EPS_img_7.png';


# EPS Board

<img src={EPS_3D} style={{width: '512px'}} />


## See Also

- [CDH Overview](/overview/eps)
- [CDH Software](/software#eps)


## Documentation

This document is to go through my thoughts on the current design for the Electrical Power System (EPS) of the CubeSat specifically for battery board.

I will highlight working things in
<span style={{color: 'green'}}> green </span>
and broken in
<span style={{color: 'red'}}> red </span>

The main idea of the battery board is to charge the batteries and turn on and off the power to all the other places, such as the motors, and MCU’s, and regulate the voltage to the right values.

Due to the size of the 100-pin package this current board only has one MCU on it, this will need to be updated to two MCU with MUX’s. I had a time constraint preventing me from getting the two MCU designs done. This will need to be done, to be flight ready, and it can be done. It will take some serious placement consideration and may need to become a 6-layer board rather than 4 layers.

The easiest way to add the MUX’s and second MCU is to go to the CDH schematic and follow the way it connects to the MUX’s and watchdog. Another good source would be the motor board; it is the 100-pin package and has been created with 2 MCU’s.

The main challenge with fitting the two MCU’s on the board was the fact that there are so many MUX’s. You will need to MUX every on/off switch and all the other normal MUX connections; it can be done, but it will be a tight fit.

So, walking through my schematic that is not the MCU block, there is the battery charger.

<img src={EPS_img_2} style={{width: '512px'}} />
*Image 2: Battery Charger Schematic*

For this, I just followed the data sheet for the BQ24610 and came up with this design. With the battery charger, there needs to be a battery balancer as well. I did not put that on this board design for the simple fact that I wanted to see if the battery charger would work, and then in the next design I was going to add the battery balancer assuming that the charger worked. Due to time constraints, I could not order the board again.

The battery charger does work? .... 
<span style={{color: 'red'}}> Still needs to be tested, </span>
I unfortunately put P channel MOSFETS rather than N channel, I have fixed this on KiCad so that when you order the board you get the correct, but it still needs to be tested with N channel to see if the battery charger will do what we want. \
Update... unfortunately both populated battery boards have died. So, to test the battery charger you will need to get new ones from JLC PCB. The reason both battery boards are dead is because I did not have a battery balancer on the board. So, when we put the second parallel pack of batteries on, they fought each other and sent too much current to the voltage regulators and burned them up. 

<img src={EPS_img_3} style={{width: '512px'}} />
*Image 3: Battery Charger*

In this figure you can see the red circle is the MOSFETS that I changed to N.

Do the voltage regulators work?
<span style={{color: 'green'}}> Yes! </span>
I get 3.3V, 5V, and 12V with a voltage of at least 14V on the battery input. One thing I overlooked in the design was if the voltage regulators could handle the current draw needed at each voltage level. For example, on the 12V line there are the motors, and magnetorquers, you will need to make sure that the voltage regulator can handle the maximum current for the magnetorquers and motors running at 100%.

<img src={EPS_img_4} style={{height: '512px'}} />
*Image 4: Voltage regulators for 5V and 12V*

Do the heaters PWM work?
<span style={{color: 'green'}}> Yes! </span>
The heaters have a low side switch and we can PWM those pins to get an average heat. Keep in mind the battery heaters run off 5V and that is currently the only thing using 5V.

<img src={EPS_img_5} style={{width: '512px'}} />
*Image 5: Battery heaters and the low side switches*

Do the on/off switches work?
<span style={{color: 'green'}}> Yes! </span>
They work as intended.  The small ones are for the 3.3V lines, and the big switch is for the motors.

<img src={EPS_img_6} style={{width: '512px'}} />
*Image 6: All the high side switches the big IC is the motors switch and the small ICs are the MCU on off switches*

Do the voltage and current sensors work? ...
<span style={{color: 'red'}}> Probably.... </span>
still needed to be tested and unfortunately, we could not test them...

<img src={EPS_img_7} style={{width: '512px'}} />
*Image 7: Voltage and current sensors on the board*

So, in conclusion the changes that need to be made to the battery board is
<span style={{color: 'red'}}>
    1. Add a battery balancer. This is essential.
    2. Test the battery charger and make sure it will work how you want.
    3. Test the voltage and current sensors and make sure they work how we want. 
    4. Add a second MCU and all associated MUX’s (this will be the hardest thing to do due to size constraints, if you use the back side make sure it fits within the space given with the battery pack attached to the back. Check with structure for those dimensions.)
    5. Make sure that the voltage regulators for the 12V line can handle the current for the motors and magnetorquers at full run. (From what I can tell it should)
    6. Ensure that the pin connections for the main back plane are consistent between all boards, the main back plane is where all the other boards connect, and you need to make sure that the places you put the power for other MCU’s match what the other boards design is so you only power on one MCU at a time. 
    7. There needs to be a remove before flight plug. I did not put anything on the circuit for that. So it will likely need to be two lines on the back plane that go to the phone jack that the structure team is using as the RBF plug. It needs to go between the battery pack and the loads.
</span>


## Full Schematic

### EPS Schematic
![EPS Schematic](./img/Battery_Board_2.0.svg)

### MCU Schematic
![EPS Schematic](./img/Battery_Board_2.0-MCU_100_Pin.svg)


## Pin Mappings

Pin mappings not yet documented. See the sechematic. 


*(See original document for author contact info.)*
