# Q-Learning Network Simulator

## What

A simulation comparing learning-based network routing with Dijkstra and OSPF.

## Why

We studied how routing strategies respond to changing traffic. This is research work, not a deployed network product.

## Demo

No public hosted demo is verified; the repository documents a local simulation.

## Run it

The upstream README specifies Python 3.13.1 and uv. In an activated environment, it documents `uv pip install -e .`, then `python demo.py` from the repository root. Optional flags and environment compatibility need rechecking before reuse.

## How it's tested

The README lists `pytest`, `mypy .` and `ruff check .` after development dependencies are installed. These were not executed here; simulation metrics do not establish a production routing advantage.

## How it works

SimPy models event timing and NetworkX represents topology. Traffic patterns exercise the routing strategies. I contributed as part of the research team.

## Status

Historical research project. Evidence: upstream README and approved registry; no new performance result is claimed.

## More

[Research context](https://kakosyaneduard.ca/projects/network-sim).
