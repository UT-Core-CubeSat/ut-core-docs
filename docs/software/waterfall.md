---
sidebar_position: 0
title: Waterfall Method Board Requirements
---

# Waterfall Method Board Requirements


## Intro: 

This document was how we determined verifiable requirements for each board and it's how we planned how to tackle each board and what software we wanted to right. Writing software with no clearly defined goal leads to unnecessary and unfocused code  

Look into AGILE methodologies for software development and if you've taken CS 2450 (Software Engineering) then try to remember what you learned lol. 
 
 
## CDH Software Requirements 

    - Manage CAN BUS Tx/Rx 
    - Compile SOH (State of Health) for subsystems 
    - Handle data routing 
    - Read Internal sensor data 
    - Determine Uplink/downlink schedule 
    - Determine experiment pass time (determine when we want to take the photos) 
    - Based off GNSS data determine if we are where we need to be to take our photos, update mode etc. 
    - Tell subsystems what to do/when to do it 
    - Respond to ground commands from COMMS board 
    - Determine modes (ex: standby, sleep, deep sleep, low power) 
    - Monitor watchdog/pings 
    - Schedule downlinks 

## EPS Software Requirements

    - Receive Serial data from external sensors 
    - Watch for pings from the CDH 
    - Monitor power usage and generation 
    - Monitor each subsystems power data 
    - Monitor battery data 
    - Package SOH data and send to CDH 
 
## COMMS Software Requirements

    - Transmit and receive data 
    - Collect data frames from uplink 
    - Collect data frames from CDH output to RF 
    - Package SOH data and send to CDH 

## ADCS Software Requirements 

    - Reports attitude to CDH (vector plus rates) 
    - SOH to CDH 
    - Responds to commands 
    - Sun pointing 
    - Nadir – GNSS 
    - Grund point 
    - Takes in star tracker vector 
    - Read magnetometers and IMUs 

## GNSS Software Requirements 

    - Receive data from GNSS chip 
    - Process GNSS data into usable lat/long and speed format 
    - Output lat/long and speed data to the CDH  

## Motor Driver Board Software Requirements 

    - Receive instructions from ADCS 
    - Tells the motors what to do 
    - Report wheel speed magnet torquer current, and temp to CDH AND ADCS 
 
## Star Tracker Board Software Requirements 

    - Intakes an image from the onboard camera 
    - Processes the image 
    - Reports SOH, attitude vector to CDH and ADCS 

## Solar Conglomerator  

    - Run magnetorquer 
    - Msg from ADCS to turn on magnetorquers 
    - For x amt of time 
    - Heartbeat to CDH 

## Payload 
    - TDB
