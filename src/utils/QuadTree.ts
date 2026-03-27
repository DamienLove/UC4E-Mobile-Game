import { GameNode } from '../types';

export interface ForceResult {
  ax: number;
  ay: number;
}

interface Body {
  x: number;
  y: number;
  mass: number;
  node?: GameNode;
}

const MAX_DEPTH = 12; // Sufficient depth for reasonable precision without stack overflow

export class QuadTree {
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;

  totalMass: number = 0;
  centerOfMassX: number = 0;
  centerOfMassY: number = 0;

  divided: boolean = false;
  nw: QuadTree | null = null;
  ne: QuadTree | null = null;
  sw: QuadTree | null = null;
  se: QuadTree | null = null;

  // Store bodies. Typically 1, but can be more if MAX_DEPTH reached.
  bodies: Body[] = [];

  constructor(x: number, y: number, width: number, height: number, level: number = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.level = level;
  }

  insert(node: GameNode): boolean {
    const mass = (node.type === 'star' ? 0.5 : 0.1) * node.radius;
    const body: Body = { x: node.x, y: node.y, mass, node };
    return this.insertBody(body);
  }

  private insertBody(body: Body): boolean {
    if (!this.contains(body.x, body.y)) {
      return false;
    }

    if (this.divided) {
        if (this.nw!.insertBody(body)) return true;
        if (this.ne!.insertBody(body)) return true;
        if (this.sw!.insertBody(body)) return true;
        if (this.se!.insertBody(body)) return true;
        return false;
    }

    this.bodies.push(body);

    // If too many bodies and not at max depth, subdivide
    if (this.bodies.length > 1 && this.level < MAX_DEPTH) {
        this.subdivide();

        // Move existing bodies to children
        for (const b of this.bodies) {
            if (this.nw!.insertBody(b)) continue;
            if (this.ne!.insertBody(b)) continue;
            if (this.sw!.insertBody(b)) continue;
            if (this.se!.insertBody(b)) continue;
        }
        this.bodies = []; // Clear bodies from this node as they are now in children
    }

    return true;
  }

  contains(x: number, y: number): boolean {
    return (
      x >= this.x &&
      x < this.x + this.width &&
      y >= this.y &&
      y < this.y + this.height
    );
  }

  subdivide() {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    const nextLevel = this.level + 1;

    this.nw = new QuadTree(this.x, this.y, halfWidth, halfHeight, nextLevel);
    this.ne = new QuadTree(this.x + halfWidth, this.y, halfWidth, halfHeight, nextLevel);
    this.sw = new QuadTree(this.x, this.y + halfHeight, halfWidth, halfHeight, nextLevel);
    this.se = new QuadTree(this.x + halfWidth, this.y + halfHeight, halfWidth, halfHeight, nextLevel);

    this.divided = true;
  }

  calculateMassDistribution() {
      if (!this.divided) {
          if (this.bodies.length > 0) {
              let totalM = 0;
              let weightedX = 0;
              let weightedY = 0;

              for (const b of this.bodies) {
                  totalM += b.mass;
                  weightedX += b.x * b.mass;
                  weightedY += b.y * b.mass;
              }

              this.totalMass = totalM;
              this.centerOfMassX = weightedX / totalM;
              this.centerOfMassY = weightedY / totalM;
          } else {
              this.totalMass = 0;
              this.centerOfMassX = 0;
              this.centerOfMassY = 0;
          }
          return;
      }

      this.nw!.calculateMassDistribution();
      this.ne!.calculateMassDistribution();
      this.sw!.calculateMassDistribution();
      this.se!.calculateMassDistribution();

      this.totalMass = this.nw!.totalMass + this.ne!.totalMass + this.sw!.totalMass + this.se!.totalMass;

      if (this.totalMass > 0) {
          this.centerOfMassX = (
              this.nw!.centerOfMassX * this.nw!.totalMass +
              this.ne!.centerOfMassX * this.ne!.totalMass +
              this.sw!.centerOfMassX * this.sw!.totalMass +
              this.se!.centerOfMassX * this.se!.totalMass
          ) / this.totalMass;

          this.centerOfMassY = (
              this.nw!.centerOfMassY * this.nw!.totalMass +
              this.ne!.centerOfMassY * this.ne!.totalMass +
              this.sw!.centerOfMassY * this.sw!.totalMass +
              this.se!.centerOfMassY * this.se!.totalMass
          ) / this.totalMass;
      } else {
          this.centerOfMassX = 0;
          this.centerOfMassY = 0;
      }
  }

  calculateForce(node: GameNode, theta: number = 0.5): ForceResult {
      let ax = 0;
      let ay = 0;

      if (this.totalMass === 0) return { ax, ay };

      // Distance to CoM
      const dx = this.centerOfMassX - node.x;
      const dy = this.centerOfMassY - node.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      // Width of the region
      const size = Math.max(this.width, this.height);

      // If sufficiently far away, use CoM approximation
      if ((size / dist) < theta) {
          if (distSq > 1) {
             const force = this.totalMass / distSq;
             ax += (dx / dist) * force;
             ay += (dy / dist) * force;
          }
      } else if (this.divided) {
          // Recurse
          const fNw = this.nw!.calculateForce(node, theta);
          const fNe = this.ne!.calculateForce(node, theta);
          const fSw = this.sw!.calculateForce(node, theta);
          const fSe = this.se!.calculateForce(node, theta);

          ax += fNw.ax + fNe.ax + fSw.ax + fSe.ax;
          ay += fNw.ay + fNe.ay + fSw.ay + fSe.ay;
      } else {
          // Leaf node (not divided), iterate bodies
          // This handles bodies in a leaf node (at max depth or just single body) when close
          for (const body of this.bodies) {
              if (body.node?.id === node.id) continue;

              const bdx = body.x - node.x;
              const bdy = body.y - node.y;
              const bDistSq = bdx * bdx + bdy * bdy;

              if (bDistSq > 1) {
                  const bDist = Math.sqrt(bDistSq);
                  const force = body.mass / bDistSq;
                  ax += (bdx / bDist) * force;
                  ay += (bdy / bDist) * force;
              }
          }
      }

      return { ax, ay };
  }
}
