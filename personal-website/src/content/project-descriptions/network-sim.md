# Q-Learning Network Simulator

I worked on this with Ethan Rozee and Jack Whitmar. We built a simulator to compare Q-routing, which learns routing decisions over time, with Dijkstra and OSPF.

## What we compared

We ran the algorithms on sparse and dense networks with steady, periodic, and burst traffic. The simulator records throughput, delay, packet loss, and link utilization so we can compare how each approach behaves as conditions change.

## How it works

SimPy handles the discrete events, and NetworkX represents the network. A scheduler generates traffic while the routing algorithms decide where to send it. The Q-learning agent updates its routing decisions from what happens during the simulation.

The project uses Python. The repository includes setup instructions and options for changing the number of nodes, network topology, traffic pattern, and run duration.

[Source code and simulation instructions](https://github.com/EduardKakosyan/q-learning-network-sim)
