---
sidebar_position: 2
title: Getting Started — Build + Flash
---

# Getting started

## UT-Core-Cubesat GitHub Repositories

- [ut-core-zephyr](https://github.com/UT-Core-CubeSat/ut-core-zephyr)
- [ut-core-controls](https://github.com/UT-Core-CubeSat/ut-core-controls)
- [ut-core-docs](https://github.com/UT-Core-CubeSat/ut-core-docs)



## Cloning ut-core-zephyr

To clone the [ut-core-zephyr](https://github.com/UT-Core-CubeSat/ut-core-zephyr) repository,

```bash
# Clone stable branch
git clone https://github.com/UT-Core-CubeSat/ut-core-zephyr.git

# Clone development branch (recommended)
git clone -b unstable https://github.com/UT-Core-CubeSat/ut-core-zephyr.git
```

## Contributing

Make sure to read through the contributing guidelines at UT-Core Zephyr
[CONTRIBUTING.md](https://github.com/UT-Core-CubeSat/ut-core-zephyr/blob/master/CONTRIBUTING.md).

## Building and Flashing

For information on how to build and flash software to the boards, see UT-Core Zephyr
[README.md](https://github.com/UT-Core-CubeSat/ut-core-zephyr/blob/master/README.md).









{/*

# Getting Started — Build + Flash

This page gets you from **clone → build → flash → verify** using Zephyr + `west`.

> Assumption: UT-CORE firmware is Zephyr-based and your board target is `ut_core` (STM32U5A5xx qualifier).

---

## 0) Prereqs

You need:
- A working **Zephyr workspace**
- `west` installed
- A supported toolchain (Zephyr SDK or vendor toolchain)
- A way to flash STM32 (typically **ST-Link**)

If you already run commands like `west build`, you’re good.

---

## 1) Confirm you have the board in Zephyr

From your Zephyr workspace root, list boards and confirm `ut_core` exists:

```bash
west boards | grep -i ut_core

*/}
