// Waypoint graph for YARD 7. Nodes sit on open floor, edges are straight
import * as THREE from 'three';

const POINTS = [
  [-4, 15], [0, 15.5], [4, 15], [-2, 16.5], // 0-3 attacker spawn
  [-8, 10], [0, 10], [8, 10], // 4-6 south
  [-16, 12], [-16, 5], [-16, -2], [-12, -5], // 7-10 A lane (10: gap approach)
  [16, 12], [16, 5], [16, -2], [12, -5], // 11-14 B lane
  [0, 2], [-6.5, -1], [6.5, -1], [-8.5, -9], [8.5, -9], // 15-19 mid
  [-13.5, -9], [-14, -10.5], [-16.5, -10], [-13.5, -13.8], // 20-23 site A
  [13.5, -9], [15, -11], [16.5, -10], [13.5, -13.8], // 24-27 site B
  [-7, -15.5], [0, -16.5], [7, -15.5], [-10, -16], [10, -16], // 28-32 defender spawn
  [-12, -11.5], [12, -11.5], // 33-34 site-side hold spots
  [-9, -11.5], [9, -11.5], // 35-36 north gaps
  [-12, -8.5], [12, -8.5], // 37-38 site entries
  [-9, -14.5], [9, -14.5], // 39-40 north strip
];

const LINKS = [
  [0, 4], [0, 5], [1, 5], [2, 5], [2, 6], [3, 4], [3, 5], [4, 5], [5, 6], [4, 6], [4, 15],
  [7, 8], [8, 9], [9, 10], [10, 37], [37, 20], [37, 21], [20, 21], [20, 23], [21, 22], [21, 23],
  [11, 12], [12, 13], [13, 14], [14, 38], [38, 24], [38, 25], [24, 25], [24, 27], [25, 26], [25, 27],
  [15, 16], [15, 17], [16, 18], [17, 19], [18, 19],
  [16, 9], [17, 13],
  [28, 29], [29, 30], [28, 31], [31, 39], [30, 32], [32, 40], [33, 23],
  [34, 26], [35, 18], [36, 19],
  [28, 39], [29, 39], [29, 40], [30, 40],
];

const neighbours = POINTS.map(() => []);
for (const [a, b] of LINKS) {
  neighbours[a].push(b);
  neighbours[b].push(a);
}

export const WAYPOINTS = POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z));

export function nearestNode(x, z) {
  let closest = 0;
  let closestDist = Infinity;
  for (let i = 0; i < POINTS.length; i += 1) {
    const dx = POINTS[i][0] - x;
    const dz = POINTS[i][1] - z;
    const distSq = dx * dx + dz * dz;
    if (distSq < closestDist) {
      closestDist = distSq;
      closest = i;
    }
  }
  return closest;
}

export function route(from, to) {
  if (from === to) return [from];
  const cameFrom = new Array(POINTS.length).fill(-1);
  cameFrom[from] = from;
  const queue = [from];
  let head = 0;
  while (head < queue.length) {
    const current = queue[head];
    head += 1;
    for (const next of neighbours[current]) {
      if (cameFrom[next] !== -1) continue;
      cameFrom[next] = current;
      if (next === to) {
        const path = [to];
        let node = to;
        while (node !== from) {
          node = cameFrom[node];
          path.unshift(node);
        }
        return path;
      }
      queue.push(next);
    }
  }
  return [from, to];
}

export const SITE_NODES = { A: [21, 22, 23, 20], B: [25, 26, 27, 24] };
export const SPAWN_NODES = { attack: [0, 1, 2, 3], defend: [28, 29, 30, 31, 32] };
export const MID_NODES = [15, 16, 17];
export const LONG_NODES = { A: [10, 37], B: [14, 38] };
