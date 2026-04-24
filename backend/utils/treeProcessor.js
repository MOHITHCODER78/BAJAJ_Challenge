/**
 * here we processes the input data to build trees, detect cycles, and calculate depths.
 */

function processHierarchies(data) {
    const invalid_entries = [];
    const duplicate_edges = [];
    const valid_edges = [];
    const seen_edges = new Set();
    const child_to_parent = new Map(); // For multi-parent rule: first parent wins

    // 1. Validation and Duplicate Detection
    data.forEach(entry => {
        const trimmed = entry.trim();
        if (!/^[A-Z]->[A-Z]$/.test(trimmed)) {
            invalid_entries.push(entry);
            return;
        }

        const [parent, child] = trimmed.split('->');
        if (parent === child) {
            invalid_entries.push(entry);
            return;
        }

        if (seen_edges.has(trimmed)) {
            if (!duplicate_edges.includes(trimmed)) {
                duplicate_edges.push(trimmed);
            }
            return;
        }

        seen_edges.add(trimmed);

        // Multi-parent case: first encountered parent wins
        if (child_to_parent.has(child)) {
            // Silently discard subsequent parent edges for that child
            return;
        }

        child_to_parent.set(child, parent);
        valid_edges.push({ parent, child });
    });

    // 2. Build Graph
    const adj = {};
    const nodes = new Set();
    const all_parents = new Set();
    const all_children = new Set();

    valid_edges.forEach(({ parent, child }) => {
        if (!adj[parent]) adj[parent] = [];
        adj[parent].push(child);
        nodes.add(parent);
        nodes.add(child);
        all_parents.add(parent);
        all_children.add(child);
    });

    // 3. Find Groups (Connected Components)
    // We treat the graph as undirected for finding components
    const undirected_adj = {};
    nodes.forEach(node => undirected_adj[node] = []);
    valid_edges.forEach(({ parent, child }) => {
        undirected_adj[parent].push(child);
        undirected_adj[child].push(parent);
    });

    const visited_components = new Set();
    const groups = [];

    nodes.forEach(node => {
        if (!visited_components.has(node)) {
            const component = [];
            const queue = [node];
            visited_components.add(node);
            while (queue.length > 0) {
                const u = queue.shift();
                component.push(u);
                (undirected_adj[u] || []).forEach(v => {
                    if (!visited_components.has(v)) {
                        visited_components.add(v);
                        queue.push(v);
                    }
                });
            }
            groups.push(component);
        }
    });

    // 4. Process each group
    const hierarchies = [];
    let total_trees = 0;
    let total_cycles = 0;
    let max_depth = -1;
    let largest_tree_root = "";

    groups.forEach(group => {
        // Potential roots: nodes in group that are never children in valid_edges
        const group_nodes = new Set(group);
        const roots = group.filter(node => !all_children.has(node)).sort();

        let root = "";
        let is_pure_cycle = false;

        if (roots.length > 0) {
            root = roots[0]; // Take the first lexicographical root
        } else {
            // Pure cycle: lexicographically smallest node
            root = group.sort()[0];
            is_pure_cycle = true;
        }

        // Cycle detection and tree building
        const { has_cycle, tree, depth } = analyzeGroup(root, adj, group_nodes);

        const hierarchy = { root, tree };
        if (has_cycle || is_pure_cycle) {
            hierarchy.has_cycle = true;
            hierarchy.tree = {};
            total_cycles++;
        } else {
            hierarchy.depth = depth;
            total_trees++;

            // Summary tiebreaker
            if (depth > max_depth) {
                max_depth = depth;
                largest_tree_root = root;
            } else if (depth === max_depth) {
                if (!largest_tree_root || root < largest_tree_root) {
                    largest_tree_root = root;
                }
            }
        }
        hierarchies.push(hierarchy);
    });

    // Sort hierarchies by root lexicographically
    hierarchies.sort((a, b) => a.root.localeCompare(b.root));

    return {
        hierarchies,
        invalid_entries,
        duplicate_edges,
        summary: {
            total_trees,
            total_cycles,
            largest_tree_root
        }
    };
}

function analyzeGroup(root, adj, group_nodes) {
    const visited = new Set();
    const recStack = new Set();
    let has_cycle = false;

    function detectCycle(u) {
        visited.add(u);
        recStack.add(u);

        const children = adj[u] || [];
        for (const v of children) {
            if (!visited.has(v)) {
                if (detectCycle(v)) return true;
            } else if (recStack.has(v)) {
                return true;
            }
        }

        recStack.delete(u);
        return false;
    }

    if (detectCycle(root)) {
        has_cycle = true;
    }

    // Check if all nodes in group were visited from this root
    // If not, and there's no cycle yet, it might be a multi-root group (which shouldn't happen with our component logic + root definition, but safety first)
    if (!has_cycle) {
        for (const node of group_nodes) {
            if (!visited.has(node)) {
                // This means there's another root or a disconnected cycle
                // But our component logic ensures they are connected.
                // However, a DAG could have multiple roots. The requirement says:
                // "return each separately in the hierarchies array". 
                // Wait, if a component has multiple roots, is it one tree or multiple?
                // "A root is a node that never appears as a child".
                // If A->C and B->C, then A and B are roots. 
                // But the multi-parent rule says "first encountered parent wins".
                // This means A->C wins, B->C is discarded.
                // So each component will have exactly one root (unless it's a pure cycle).
            }
        }
    }

    if (has_cycle) {
        return { has_cycle: true, tree: {}, depth: 0 };
    }

    // Build Nested Tree and Calculate Depth
    function buildTree(u) {
        const node_tree = {};
        let max_child_depth = 0;
        const children = (adj[u] || []).sort(); // Sort children lexicographically for consistent output

        children.forEach(v => {
            const { subtree, d } = buildTree(v);
            node_tree[v] = subtree;
            max_child_depth = Math.max(max_child_depth, d);
        });

        return { subtree: node_tree, d: max_child_depth + 1 };
    }

    const { subtree, d } = buildTree(root);
    const final_tree = { [root]: subtree };

    return { has_cycle: false, tree: final_tree, depth: d };
}

module.exports = { processHierarchies };
