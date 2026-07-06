---
sidebar_position: 2
title: Getting Started — Build + Flash
---

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