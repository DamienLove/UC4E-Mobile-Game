
import { QuadTree } from '../src/utils/QuadTree';
import { GameNode } from '../src/types';

const NUM_NODES = 2000;
const TICKS = 100;

function createNodes(count: number): GameNode[] {
    const nodes: GameNode[] = [];

    // Player
    nodes.push({
        id: 'player_consciousness',
        label: 'You',
        type: 'player_consciousness',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 20,
        connections: [],
        hasLife: false
    });

    for (let i = 1; i < count; i++) {
        nodes.push({
            id: `node_${i}`,
            label: `Node ${i}`,
            type: Math.random() < 0.1 ? 'star' : 'rocky_planet',
            x: (Math.random() - 0.5) * 2000,
            y: (Math.random() - 0.5) * 2000,
            vx: 0,
            vy: 0,
            radius: Math.random() * 20 + 5,
            connections: [],
            hasLife: false
        });
    }
    return nodes;
}

function runBenchmark() {
    console.log(`Setting up OPTIMIZED benchmark with ${NUM_NODES} nodes...`);
    const nodes = createNodes(NUM_NODES);

    console.log(`Running simulation for ${TICKS} ticks...`);
    const startTime = performance.now();

    for (let t = 0; t < TICKS; t++) {
        // Optimized Gravity Logic using QuadTree

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const node of nodes) {
            if (node.x < minX) minX = node.x;
            if (node.y < minY) minY = node.y;
            if (node.x > maxX) maxX = node.x;
            if (node.y > maxY) maxY = node.y;
        }

        const qtPadding = 200;
        if (minX === Infinity) { minX = 0; maxX = 100; minY = 0; maxY = 100; }

        const qt = new QuadTree(minX - qtPadding, minY - qtPadding, (maxX - minX) + qtPadding * 2, (maxY - minY) + qtPadding * 2);
        nodes.forEach(node => qt.insert(node));
        qt.calculateMassDistribution();

        nodes.forEach(node => {
            if (node.type !== 'player_consciousness') {
                const force = qt.calculateForce(node, 0.5);
                node.vx += force.ax;
                node.vy += force.ay;
            }
            // Update positions (simplified)
            node.x += node.vx;
            node.y += node.vy;
        });
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`Optimized Benchmark completed in ${duration.toFixed(2)}ms`);
    console.log(`Average time per tick: ${(duration / TICKS).toFixed(2)}ms`);
}

runBenchmark();
