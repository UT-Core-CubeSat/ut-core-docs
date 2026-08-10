---
sidebar_position: 0
title: Zephyr Custom Boards
---

# Zephyr Custom Boards

Here is an in-depth breakdown of the specific board files explaining how they interact with the Zephyr build system (CMake, Kconfig, and Devicetree). 

 
## 1. Build & Flashing Logic 

These files tell the build system how to handle your board and which tools to use. 

`board.cmake`

    - **Purpose:** This file configures the build system for hardware-specific flashing and debugging tools. 
    - **What it does:** It tells Zephyr which "runner" to use (e.g., JLink, STM32CubeProgrammer, OpenOCD) and passes specific arguments to them, such as the board's specific Flash start address or size if it differs from the default SoC definition. 
    - **Key Concept:** If you try to run west flash and it fails because it can't find the debugger, the issue is usually here. 

`board.yml`

    - **Purpose:** This is the **Board Metadata** file (part of the newer Hardware Model v2). 
    - **What it does:** It acts as an index for the build system. It lists the board name, vendor, and crucially, it specifies which SoC (System on Chip) the board uses. 
    - **Key Concept:** This file replaces some of the "magic" file naming conventions of older Zephyr versions. It explicitly links your board name (e.g., my_custom_u5) to a specific SoC target (e.g., stm32u5a5xx). 

 
## 2. Configuration (Kconfig) 

These files determine *software features* and *driver selection*. 

`Kconfig.{board name}` *(e.g., `Kconfig.my_board`)*

    - **Purpose:** The Board-Specific Kconfig Definition. 
    - **What it does:** This file adds your board to the global list of Zephyr boards. It is usually where you select the internal SoC architecture. 
    - **Key Concept:** It usually contains a config BOARD_MY_BOARD block. When you run west build -b my_board, Zephyr looks here to set that boolean to "true," which triggers the selection of the STM32U5 SoC symbols. 

`{board name}_defconfig` *(e.g., `my_board_defconfig`)*

    - **Purpose:** The Default Configuration. 
    - **What it does:** This is a list of default settings for your board. It is where you enable the drivers you know you will always need (e.g., GPIO, SPI, Console). 
    - **Key Concept:** Think of this as the "factory settings" for your firmware. You can override these later in your application's prj.conf, but this file sets the baseline. If your board has an external flash chip, you would enable the SPI NOR driver here. 

 
## 3. Hardware Description (Devicetree) 

These files describe the *physical hardware* (pins, addresses, and connections). 

`{board name}.dts`

    - **Purpose:** The Main Devicetree Source. 
    - **What it does:** This represents the final hardware description of your board. It includes the SoC definition (via #include) and then defines exactly how pins are used. 
    - **Key Concept:** This is where you declare "The UART2 peripheral is connected to pins PA2 and PA3," or "There is an LED connected to PC13." If it's not in the DTS, Zephyr's drivers generally won't know the hardware exists. 

`{board name}-common.dtsi`

    - **Purpose:** Shared Devicetree Include. 
    - **What it does:** The .dtsi extension stands for Devicetree Source Include. If you copied the Nucleo files, you likely see this because the Nucleo supports multiple variants (e.g., different voltages or connectors) that share 90% of the same circuitry. 
    - **Key Concept:** In a custom board, you often put the bulk of your definitions here, and then your main .dts file simply includes this one. It helps keep things modular if you plan to make a "Rev B" of your custom board later; you can just create a new .dts that includes this common .dtsi and overrides only what changed. 


## 4. Testing & Metadata 

`{board name}.yaml`

    - **Purpose:** Twister (Test Runner) Configuration. 
    - **What it does:** This file is used by Zephyr's CI/CD tool, twister. It defines which test cases the board supports. For example, if your board doesn't have enough RAM to run a specific network test, you would exclude it here. 
    - **Key Concept:** For a pure custom prototype, this is often optional, but keeping it ensures you can run Zephyr's vast suite of regression tests against your new hardware to verify stability. 

 

## Summary Table 

| File          | Domain      | Main Function |
|---------------|-------------|---------------|
| board.cmake   | Build/Flash | Configures OpenOCD/JLink runners. 
| board.yml     | Metadata    | Links Board Name to SoC Part Number. 
| Kconfig.board | Config      | Defines the board symbol and selects the CPU architecture. 
| defconfig     | Config      | Enables default drivers (Serial, GPIO, Clocks). 
| .dts / .dtsi  | Hardware    | Maps physical pins to functions (UART, SPI, LEDs). 
| .yaml         | Testing     | Defines capabilities for automated testing (Twister). 

 
