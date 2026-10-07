# Moonfang plated-shoulder verification

Source visual truth: `/workspace/generated_images/exec-78a37fb5-5d12-4452-b196-730bc9866d25.png`.
The user combined the embossed plate from the first ideation image with the
sculpted wolf crest from the second, then requested swapped shoulders and a
larger rounded crest. Viewer-left is the enlarged wolf-head pauldron;
viewer-right is the silver wolf relief. The original inventory icon is retained
at the user's explicit request.

## Evidence and normalization

The source and implementation are shown together in
`/workspace/artifacts/moonfang-reference-comparison.png` (1100x620 viewport,
deviceScaleFactor 1). The 1280x1280 master is cropped to 1241x916+7+201,
aspect-preservingly resized to 106px tall and bottom-centered on a 148x110
transparent canvas. The comparison displays the normalized source and packaged
sprite at twice their native size, alongside the actual Alpha composition.
Expected downsampling is visible at that enlarged inspection scale.

Full-view evidence: `/workspace/artifacts/moonfang-shoulder-comparison.png`
(1320x1000 viewport, full-page capture, density 1). It compares the previous
worn layer with the revision, then checks uncovered heads, Leather Hood,
Wolf Helmet and Alpha at 160px detail, 80px roster and 64px named combat size.
Focused source/packaged/worn evidence is in the reference comparison above.

Real app evidence: `/workspace/artifacts/moonfang-company-tablet.png`
(1100x850) and `/workspace/artifacts/moonfang-company-phone.png` (390x844),
full-page captures at density 1. State: paused company with ordinary Moonfang,
Alpha helmet, arming sword and buckler equipped. Company navigation was tested;
all rendered portrait images decoded. Browser errors: none. Phone page overflow:
none. This artwork revision does not claim new browser crafting-flow coverage.

## Findings and comparison history

The earlier fur projection crowded the character card and was clipped by the
roster tile. The final design replaces that projection with compact metal caps.
A 126px Moonfang roster tile keeps both shoulders visible; the equipment preview
uses its original size and anchors. Post-fix evidence is the real tablet/phone
capture and the final helmet lineup. The left wolf face and protective lames
remain readable beside the helmet fur; human eyes, mouth and jaw remain clear.
No actionable P0/P1/P2 findings remain.

## Fidelity surfaces

- Typography: existing application fonts, weights, labels and wrapping retained;
  the source armor asset has no text.
- Spacing/layout: empty neckline aligned at left-26/top10; both shoulders fit
  the company card and wider roster tile. No page overflow at 390px.
- Colors: worn steel/silver, ash-grey fur and warm leather match the selected
  raster target and existing game palette.
- Asset quality: generated PNG preserves silhouette and transparency, with
  aspect-preserving packaging; no replacement vector/CSS artwork. Native game
  sizes remain readable; named items share the same worn layer. Inventory PNG
  is byte-for-byte unchanged from the previous branch.
- Copy/content: inspection now describes the plated shoulders. Recipes, fees,
  protection, fatigue and set bonuses keep their existing values.

## Implementation checklist

- Package the selected worn master and record source/output SHA-256 hashes.
- Align both shoulders, check all three helmets and named rendering.
- Fit the roster tile and inspect tablet/phone equipment screens.
- Regenerate the offline worker and run artwork, fitting, release/offline checks.

All 97 focused checks pass, including the repaired Wolf Helmet's deliberate
render anchor; the independent imported-source anchor checks remain intact.
Physical-device Safari is untested. A broader full-suite attempt was stopped
while the unrelated Ashen Winter test file was still running; no complete
full-suite result is claimed for this session.

final result: passed
