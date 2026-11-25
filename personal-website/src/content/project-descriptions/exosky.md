# Sky Painters

## Problem

For NASA Space Apps Challenge 2024, October 5–6, our team of five took on the Exosky challenge: show students the night sky as it would look from another planet, and let them draw their own constellations on it.

## System

Star positions come from Gaia DR3. A Python pipeline pulled the catalogue in batches, turned each star into x, y, z coordinates with Astropy, and stored them in a local PostgreSQL database. For each planet, a script moves the origin to that planet, converts the stars back to sky coordinates, adjusts each star's brightness for its new distance, and saves the whole sky as one image. The React and Three.js front end wraps that image around you as a sphere you can turn and zoom; right-click places points and lines to draw a constellation. The live version has Earth plus 55 Cancri e, WASP-12b, TRAPPIST-1e, Kepler-186f and HD 209458 b.

## My part

I set up the repository and built the data side: the Gaia-to-PostgreSQL pipeline, the rendering from each planet's viewpoint, and the brightness adjustment. I started by querying Gaia's online service and switched to a local copy overnight, which was far faster. The pipeline's notes record 50,000,000 rows processed in 5 hours on a machine with 16 GB of RAM and 4 cores. Hao Tang wrote the coordinate transformations, Huy Huynh built most of the front end, and teammates including [@quangphucthan](https://github.com/quangphucthan) built the drawing tool.

In the week after the event I cleaned up the back end, reworked the drawing so C ends a line, got the Docker image building, and deployed it to Fly.io. The demo is still online.

[Live demo](https://skypainter.fly.dev/) · [Source code](https://github.com/EduardKakosyan/exosky_nasa)
