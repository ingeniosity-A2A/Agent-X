# Bento Series — Read Gate

The canonical Bento source artifacts are stored at repository root:

- `Bento-patch-v3.zip`
- `Bento-patch-v4.zip`
- `Bento-patch-v5 (2).zip`
- `Bento-patch-v6.zip`
- `Bento_ui.zip`
- `Bento-Exoskel-UI Master Skill MD.pdf`
- `bento-ui8-master-skills-set-gsap.md`

## Canonical implementation rule

Bento is the single card framework. Existing cards are upgraded in place; functionality, behavior, and established layout are preserved unless a Bento patch explicitly changes them.

## V5/V6 application gate

V5 is the baseline card upgrade. V6 is an additive interaction/polish layer, including the Dev Exoskeleton slide-out where specified by the V6 patch. V6 does not create a second card framework.

ESA PTAC remains wired as:

`main PTAC Bento card -> existing Troubleshoot control -> PTAC-B slide-out`

No parallel PTAC card or new trigger is permitted.

## Verification

Uploaded binary patch artifacts are retained as source artifacts because this repository connector cannot decode ZIP/PDF blobs as UTF-8. Textual Bento guidance is available in `bento-ui8-master-skills-set-gsap.md` and `docs/BENTO-OFFICIAL-UI.md`.

No GitHub Actions are required or introduced.
