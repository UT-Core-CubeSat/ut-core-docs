---
sidebar_position: 4
title: How This Project Fails (Reality Check)
---

# How This Project Fails (Reality Check)

If UT-CORE fails, it will not be because we lacked intelligence.

It will fail because of:
- Time
- Interface ambiguity
- Integration neglect
- Scope creep
- Documentation rot

This page exists to prevent that.

---

# 1. The Schedule Is a Lie

Two semesters feels long.

It is not.

Realistically, you have:

- 4–6 weeks ramp-up
- 8–10 weeks meaningful development
- 4–6 weeks integration and verification

That leaves almost no margin for:
- Redesigning subsystems
- Changing architectures mid-stream
- Discovering undocumented assumptions

If you start redesigning the bus in semester two, the mission will slip.

---

# 2. Interfaces Drift Silently

Most CubeSat failures begin here.

Someone changes:
- A CAN message ID
- A power rail voltage
- A pin assignment
- A mode behavior

And doesn’t update:
- The ICD
- The other subsystem
- The test procedure

Result:
Integration week becomes debugging week.

Rule:
> No interface change without documentation change.

---

# 3. Integration Is Always Harder Than You Think

Subsystems working independently means nothing.

What matters:
- CDH + ADCS timing interactions
- EPS brownout behavior under load
- COMMS transmit current spikes
- Mode transitions under partial failure

Integration must start early.

If integration starts in the final month, you are already late.

---

# 4. Power Budget Lies

Every team underestimates:
- Startup current
- Peak transmit current
- Reaction wheel transients
- Brownout edge cases

If EPS is treated as “just power,” the mission will fail.

EPS must be modeled, measured, and respected.

---

# 5. ADCS Complexity Is Underestimated

Earth imaging CubeSats are pointing machines.

Pointing requirements drive:
- Structural stiffness
- Sensor noise tolerance
- Control loop stability
- Reaction wheel sizing
- Mode transition timing

ADCS is not a subsystem.

It is the mission enabler.

Underestimate it and you lose mission value.

---

# 6. Documentation Decays

If docs are not updated alongside code and hardware changes:

- New team members guess.
- Old assumptions persist.
- Integration becomes archaeology.

Documentation is not busy work.

It is time compression for future engineers.

---

# 7. Scope Creep Destroys Schedules

Late additions like:
- “We should add another sensor”
- “Let’s upgrade to a different radio”
- “We can totally redesign the structure”

Kill flight readiness.

If it is not required for mission success,
it is not required.

---

# 8. Testing Is Deferred

The most common failure pattern:

> “It works on the bench. We’ll test the full stack later.”

Later never comes.

Testing must be:
- Continuous
- Structured
- Logged
- Reproducible

If you do not have written test procedures, you do not have tests.

---

# 9. Ownership Is Unclear

If no one owns:
- CAN architecture
- Mode logic
- Power safety
- Integration schedule

Then everyone assumes someone else does.

Every subsystem must have:
- A technical owner
- A documentation owner
- A test owner

---

# 10. The Bus Gets Redesigned

This is the fastest way to lose two semesters.

UT-CORE exists to prevent redesign.

If you feel the urge to redesign the bus, ask:

1. Is this mission critical?
2. Can this be solved at the payload level?
3. Are we solving a real problem or optimizing prematurely?

Mission over elegance.

---

# What Success Actually Looks Like

Success is not:

- The most advanced architecture
- The cleanest firmware abstraction
- The most ambitious payload

Success is:

- Clear interfaces
- Stable power
- Predictable modes
- Verified pointing
- Repeatable integration
- Working ground contact

---

# Final Reality

You do not have time to build the perfect CubeSat.

You have time to build a reliable one.

Respect the schedule.
Protect the interfaces.
Integrate early.
Document everything.

Then fly.