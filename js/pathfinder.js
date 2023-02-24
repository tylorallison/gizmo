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
        //from = new LevelNode(from.x, from.y, from.layer);
        //to = new LevelNode(to.x, to.y, to.layer);
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
            //if (this.dbg) console.log(`------- current: ${this.grid.idxfromxy(current.value.x,current.value.y)} => ${current.key}:${current.value}`);
            // if equal to destination, we are done
            //console.log(`current.value: ${current.value.x},${current.value.y},${current.value.layer} to: ${to.x},${to.y},${to.layer}`);
            if (equalizer(current.value, to)) {
                final = current.value;
                success = true;
                break;
            }
            // otherwise, iterate through neighbors of current node
            let neighbors = this.graph.getNeighbors(e, current.value);
            //if (this.dbg) console.log(" neighbors: " + Array.from(neighbors).join(","));
            for (const neighbor of neighbors) {
                let cf = cameFrom[neighbor];
                // calculate cost to neighbor
                let pnode = this.graph.getActions(e, equalizer(neighbor, to), cameFrom[current.value].cost, current.value, neighbor);
                if (this.dbg) console.log(`--> consider neighbor: ${neighbor} pnode: ${Fmt.ofmt(pnode)}`);
                //let newCost = cameFrom[current.value].cost + Math.round(this.graph.getNeighborCost(current.value, neighbor));
                if (pnode && (!cf || pnode.cost < cf.cost)) {
                    // update/set came from map
                    cameFrom[neighbor] = pnode;
                    // calculate priority based on guessed heuristic
                    //console.log(`heur(${neighbor},${to}): ${this.heuristicFcn(neighbor, to)}`);
                    let priority = pnode.cost + this.graph.heuristic(neighbor, to);
                    queue.add(priority, neighbor);
                    //if (this.dbg) console.log(`----> add neighbor: ${this.grid.idxfromxy(neighbor.x,neighbor.y)}:${neighbor} pri: ${priority} cf: ${Fmt.ofmt(cameFrom[neighbor])}`);
                }
            }
            if (this.dbg) console.log(`q: ${queue}`);
            // FIXME: remove
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
        console.log(`final: ${final} cameFrom: ${Fmt.ofmt(cameFrom)}`);
        for (let cf=cameFrom[final]; cf && cf.hasOwnProperty('from'); cf=cameFrom[cf.from]) {
            console.log(`cf.from: ${cf.from}, action: ${cf.actions}`);
            for (let i=cf.actions.length-1; i>=0; i--) {
                actions.unshift(cf.actions[i]);
            }
            path.unshift(cf.from);
        }
        //path.unshift(from);
        if (this.dbg) console.log(`actions: ${actions}`);
        return {cost: cost, path: path, actions: actions};
    }

}