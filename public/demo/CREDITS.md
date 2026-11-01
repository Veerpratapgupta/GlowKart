# Demo asset credits

## Stock demo face

- File: `demo-selfie.jpg`
- Source: Pexels photo **8789224**, “Close-up shot of a girl”
- Photo: https://www.pexels.com/photo/close-up-shot-of-a-girl-8789224/
- Photographer: Darina Belonogova
- Photographer profile: https://www.pexels.com/@darina-belonogova/
- License: https://www.pexels.com/license/
- Modifications: cropped to a 4:5 demo frame and compressed for the prototype.
- Use: labeled demo face only. The person is not a customer or endorser.

The Pexels license permits free use and modification, does not require attribution, and does not imply endorsement by the depicted person.

## Recorded VTO images

- Files: `vto-sun-coral.jpg`, `vto-soft-berry.jpg`, `vto-peach-nude.jpg`
- Generated: 2026-11-01 with YouCam AI Makeup Virtual Try-On.
- Source: the stock demo face above, using the three catalog shades.
- Use: recorded demo previews only. They are not fresh renders of a visitor’s photo.

The public demo labels these results as recorded YouCam VTO on a demo face.

## Catalog additions without a dedicated recorded render

Products added after the initial three shades have no per-shade recorded VTO
image. In recorded mode the API falls back to `demo-selfie.jpg` for their
`resultUrl`, and the UI always presents the visitor's own uploaded photo with a
labeled shade-direction simulation, so no fixture is ever presented as a fresh
render of a visitor's photo.
