# Q-Learning Network Simulator

This was a group research project for CSCI 4179 at Dalhousie in early 2025, with Ethan Rozee and Jack Whitmer. We asked whether a router that learns from experience with Q-learning can route packets as well as routers that compute shortest paths.

## From proposal to simulator

Our February proposal planned Q-learning load balancing across three wireless access points, simulated in GNS3 with Gymnasium. We wrote our own simulator in Python with SimPy and NetworkX instead, and the question became routing: every node picks the next hop for each packet.

## What we compared

- Dijkstra: fixed shortest-path tables.
- OSPF: shortest paths recomputed from current link costs (queueing, transmission and propagation time), refreshed more often as buffers fill. It is a simplified version of the protocol.
- Q-routing: each node learns which neighbour to use for each destination, based on its neighbours' buffer levels. Deliveries earn a reward; delays and dropped packets are penalised.

The simulator records delay, packet loss, throughput, fairness, buffer use and link utilization. A shared random number generator gives every router the same traffic, so differences come from the routing.

## What we found

An early test run on March 21, 2025, before OSPF replaced a simpler least-cost baseline, put Q-routing close to Dijkstra. On a 12-node network its average delay was 0.0838 s against Dijkstra's 0.0625 s, with no packet loss. On a 12-node ring with cross-links it delivered 9,338 packets to Dijkstra's 9,336.

Q-routing only sees its neighbours, while the other routers see the whole network. Once Ethan reworked the OSPF link costs, OSPF became the best router in every test we ran. We tuned Q-learning with a grid search and Optuna; the demo uses a learning rate of 0.5, a discount factor of 0.99 and an exploration rate of 0.1.

## How it works

SimPy runs the discrete events and NetworkX holds the topology. Traffic generators send bursts of Poisson traffic between pairs of nodes, on a sparse and a dense version of each network. `demo.py` takes the number of nodes and plots each router's results side by side.

I set up the first simulator and the package structure, ran the topology comparisons and wrote the README. Ethan built most of the routing, the OSPF router and the demo. Jack added the simulator hooks and the Q-learning rewards.

[Source code and simulation instructions](https://github.com/EduardKakosyan/q-learning-network-sim)
