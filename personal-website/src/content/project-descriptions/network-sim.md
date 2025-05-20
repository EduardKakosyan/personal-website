# Q Learning Network Simulator

## 🔍 Overview

This project presents a **comprehensive network simulator** built with [SimPy](https://simpy.readthedocs.io/) and [NetworkX](https://networkx.org/) to evaluate the performance of different routing algorithms in dynamic network environments.

---

## 🧰 Core Technologies

- **SimPy** is used to model the network as a continuous event-driven system
- **NetworkX** is used to model the network topology and traffic patterns
- The simulator is used to simulate network traffic and routing algorithms

---

## 🧠 Implemented Routing Algorithms

1. **Q-routing** (Reinforcement Learning based)
2. **Dijkstra's Shortest Path**
3. **Open Shortest Path First (OSPF)**

> The Q-routing algorithm uses reinforcement learning to dynamically adapt to changing network conditions, unlike traditional static routing approaches.

---

## 🔄 Network Topologies Support

* Sparse mesh-like networks
* Dense mesh-like networks

---

## 📊 Traffic Pattern Simulations

* Smooth (steady) traffic
* Periodic traffic
* Burst traffic

---

## 📈 Performance Metrics

The simulator collects and analyzes the following metrics:

```
- Throughput
- Delay
- Packet loss rate
- Link utilization
```

---

## 💻 Implementation Example

A simple Q-routing update function:

```python
def update_q_value(self, src, dest, next_hop, reward):
    # Q-learning update formula
    # Q(s,a) = Q(s,a) + alpha * (reward + gamma * min_a'(Q(s',a')) - Q(s,a))
    current_q = self.q_table[src][dest][next_hop]
    best_next_q = min(self.q_table[next_hop][dest].values())
    
    # Update Q-value
    self.q_table[src][dest][next_hop] = (1 - self.alpha) * current_q + \
                                        self.alpha * (reward + self.gamma * best_next_q)
``` 