export { PathGraph, Pathfinder };

import { Fmt } from "./fmt.js";
import { GizmoData } from "./gizmoData.js";
import { PriorityQueue } from "./priq.js";
import { Schema } from "./schema.js";

class PathGraph {
    contains(node) {
        return false;
    }
    *getNeighbors(e, node) {
        return [];
    }
    getActions(e, isFinal, baseCost, from, to) {
        return null;
    }
    heuristic(v1, v2) {
        return 0;
    }
    equals(v1, v2) {
        return false;
    }
}

class Pathfinder extends GizmoData {
    static {
        Schema.apply(this, 'graph', { eventable: false, parser: (o,x) => x.graph || new PathGraph()});
        Schema.apply(this, 'dbg', { dflt: false });
        Schema.apply(this, 'maxTries', { dflt: 1000 });
    }

    find(e, from, to, equalizer) {
        if (!equalizer) equalizer = this.graph.equals;
        if (this.dbg) console.log("pathfinder find: from: " + from + " to: " + to);
        let cost = 0;
        if (!this.graph.contains(from) || !this.graph.contains(to)) return undefined;
        // initialize priority queue
        let queue = new PriorityQueue();
        // initialize association lists
        let cameFrom = {}; // value to value
        // add starting point to priority queue
        queue.add(0, from);
        cameFrom[from] = {cost: 0};
        let tries = 0;
        let success = false;
        let final;
        // iterate through nodes in the priority queue
        while (!queue.empty) {
            // extract next item from queue
            let current = queue.extract();
            // if equal to destination, we are done
            if (equalizer(current.value, to)) {
                final = current.value;
                success = true;
                break;
            }
            // otherwise, iterate through neighbors of current node
            let neighbors = this.graph.getNeighbors(e, current.value);
            for (const neighbor of neighbors) {
                let cf = cameFrom[neighbor];
                // calculate cost to neighbor
                let pnode = this.graph.getActions(e, equalizer(neighbor, to), cameFrom[current.value].cost, current.value, neighbor);
                if (this.dbg) console.log(`--> consider neighbor: ${neighbor} pnode: ${Fmt.ofmt(pnode)}`);
                if (pnode && (!cf || pnode.cost < cf.cost)) {
                    // update/set came from map
                    cameFrom[neighbor] = pnode;
                    // calculate priority based on guessed heuristic
                    let priority = pnode.cost + this.graph.heuristic(neighbor, to);
                    queue.add(priority, neighbor);
                }
            }
            if (this.dbg) console.log(`q: ${queue}`);
            if (tries++ > this.maxTries) {
                if (this.dbg) console.log("reached max path tries, giving up");
                break;
            }
        }
        // check for failed path finding (no route to destination)
        if (!success) return undefined;
        // calculate cost
        cost = cameFrom[final].cost;
        // build resulting path
        let actions = [];
        let path = [final];
        for (let cf=cameFrom[final]; cf && cf.hasOwnProperty('from'); cf=cameFrom[cf.from]) {
            for (let i=cf.actions.length-1; i>=0; i--) {
                actions.unshift(cf.actions[i]);
            }
            path.unshift(cf.from);
        }
        if (this.dbg) console.log(`actions: ${actions}`);
        return {cost: cost, path: path, actions: actions};
    }

}