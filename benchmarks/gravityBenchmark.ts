
// Simple benchmark for the O(N^2) gravity logic

interface Node {
    id: string;
    type: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
}

const NUM_NODES = 2000;
const TICKS = 100;

function createNodes(count: number): Node[] {
    const nodes: Node[] = [];

    // Player
    nodes.push({
        id: 'player_consciousness',
        type: 'player_consciousness',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 20
    });

    for (let i = 1; i < count; i++) {
        nodes.push({
            id: `node_${i}`,
            type: Math.random() < 0.1 ? 'star' : 'rocky_planet',
            x: (Math.random() - 0.5) * 2000,
            y: (Math.random() - 0.5) * 2000,
            vx: 0,
            vy: 0,
            radius: Math.random() * 20 + 5
        });
    }
    return nodes;
}

function runBenchmark() {
    console.log(`Setting up benchmark with ${NUM_NODES} nodes...`);
    const nodes = createNodes(NUM_NODES);

    console.log(`Running simulation for ${TICKS} ticks...`);
    const startTime = performance.now();

    for (let t = 0; t < TICKS; t++) {
        // O(N^2) Gravity Logic
        nodes.forEach(node => {
            if (node.type !== 'player_consciousness') {
                nodes.forEach(otherNode => {
                    if (node.id === otherNode.id) return;
                    const dx = otherNode.x - node.x;
                    const dy = otherNode.y - node.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq > 1) {
                        const dist = Math.sqrt(distSq);
                        const force = (otherNode.type === 'star' ? 0.5 : 0.1) * otherNode.radius / distSq;
                        node.vx += (dx / dist) * force;
                        node.vy += (dy / dist) * force;
                    }
                });
            }
            // Update positions (simplified)
            node.x += node.vx;
            node.y += node.vy;
        });
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`Benchmark completed in ${duration.toFixed(2)}ms`);
    console.log(`Average time per tick: ${(duration / TICKS).toFixed(2)}ms`);
}

runBenchmark();
