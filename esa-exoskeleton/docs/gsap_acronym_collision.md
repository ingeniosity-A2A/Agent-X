# GSAP Acronym Collision — Ava007 Boundary Doc

## Two Unrelated "GSAP" Terms

| Term | Full Name | Domain | Real? |
|---|---|---|---|
| GSAP (anim) | GreenSock Animation Platform | Browser JS animation | ✅ Real lib |
| GSAP (isa) | Gateway Service Access Point | ISA100.11a industrial wireless | ✅ Real standard term |

## Why It Matters
The Exoskeleton spec used "GSAP" for BOTH:
- Temporal interpolator (GreenSock)
- Industrial protocol tunnel (ISA100 GW_SAP)

A developer reading the merged spec would assume the
animation library performs HART tunneling. It cannot.

## Resolution
- GreenSock → renamed `GSAP_ANIM` in code/docs
- ISA100 → use `GW_SAP` exclusively
- Never route protocol logic through animation engine

## Prior Audit Reminders
- GSAP_ANIM is RAF-capped (60–120Hz), NOT 1000Hz
- GSAP_ANIM does not natively emit to Apache Arrow
- TweenAtom (~53 tokens) = coined, not in GSAP spec
