const fs = require('fs');

const data = JSON.parse(fs.readFileSync('E:/aitest8/figma_raw.json', 'utf8'));
const doc = data.document;

console.log("=" .repeat(70));
console.log("FIGMA FILE STRUCTURE ANALYSIS");
console.log("File: ZVtFJtBsJk6BsUm4M7K8Nq - Dashboard UI Kit (SnowUI)")
console.log("=".repeat(70));

// 1. PAGES
console.log("\n### 1. PAGES ###\n");
for (const page of doc.children) {
    console.log(`[${page.id}] ${page.name} (${page.type}) - ${page.children?.length || 0} top-level children`);
}

// 2. TOP-LEVEL NODES PER PAGE
console.log("\n### 2. TOP-LEVEL NODES PER PAGE ###\n");
for (const page of doc.children) {
    console.log(`--- ${page.name} ---`);
    for (const node of page.children || []) {
        const type = node.type;
        const name = node.name;
        const children = node.children?.length || 0;
        console.log(`  ${type}: "${name}" [${children} children]`);
    }
}

// 3. INSTANCES/COMPONENTS (by componentId)
console.log("\n### 3. INSTANCE/COMPONENT USAGE (by componentId) ###\n");

const componentCounts = {};
const componentNames = {};

function countComponents(node) {
    if (node.componentId) {
        const cid = node.componentId;
        componentCounts[cid] = (componentCounts[cid] || 0) + 1;
        if (node.name && node.name !== 'INSTANCE') {
            componentNames[cid] = node.name;
        }
    }
    if (node.children) {
        node.children.forEach(countComponents);
    }
}

doc.children.forEach(page => countComponents(page));

console.log("Most used components (top 30):");
const sorted = Object.entries(componentCounts).sort((a, b) => b[1] - a[1]);
for (const [cid, count] of sorted.slice(0, 30)) {
    const name = componentNames[cid] || 'unnamed';
    console.log(`  ${cid} (${name}): ${count} instances`);
}

// 4. LOOK FOR COMPONENT_SET or COMPONENT nodes
console.log("\n### 4. SEARCHING FOR COMPONENT/COMPONENT_SET NODES ###\n");

let compCount = 0;
let compSetCount = 0;

function findComponentNodes(node) {
    if (node.type === 'COMPONENT_SET') {
        compSetCount++;
        console.log(`COMPONENT_SET: ${node.name} (${node.id}) - ${node.children?.length || 0} children`);
    }
    if (node.type === 'COMPONENT') {
        compCount++;
        console.log(`COMPONENT: ${node.name} (${node.id})`);
    }
    if (node.children) {
        node.children.forEach(findComponentNodes);
    }
}

doc.children.forEach(page => findComponentNodes(page));

console.log(`\nTotal: ${compCount} COMPONENT nodes, ${compSetCount} COMPONENT_SET nodes`);

// 5. Get the team file to find component definitions
console.log("\n### 5. UNIQUE COMPONENT FILES (by first part of componentId) ###\n");
const fileKeys = new Set();
for (const cid of Object.keys(componentCounts)) {
    const fileKey = cid.split(':')[0];
    fileKeys.add(fileKey);
}
console.log("File keys referenced:", Array.from(fileKeys).join(', '));

// 6. Check for any styles in the response
console.log("\n### 6. STYLES IN RESPONSE ###\n");
console.log("textStyles:", data.textStyles?.length || 0);
console.log("effectStyles:", data.effectStyles?.length || 0);
console.log("colorStyles:", data.colorStyles?.length || 0);

// 7. Variable collections from raw file
console.log("\n### 7. LOOKING FOR VARIABLE-RELATED DATA ###\n");

function findVariables(node, path = '') {
    if (node.boundVariables) {
        console.log(`boundVariables at ${path}/${node.name}:`, JSON.stringify(node.boundVariables).slice(0, 200));
    }
    if (node.children) {
        node.children.forEach((child, i) => findVariables(child, path + '/' + node.name));
    }
}

doc.children.forEach(page => findVariables(page));

// 8. Check for NODE_ID references that indicate library components
console.log("\n### 8. EXTERNAL LIBRARY REFERENCES ###\n");
console.log("Component IDs (file:node format) found:");
const allComponentRefs = [];
function findComponentRefs(node) {
    if (node.componentId) {
        allComponentRefs.push(node.componentId);
    }
    if (node.children) {
        node.children.forEach(findComponentRefs);
    }
}
doc.children.forEach(page => findComponentRefs(page));
console.log(`Total component references: ${allComponentRefs.length}`);
console.log("Unique component file keys:");
const fileKeyCounts = {};
allComponentRefs.forEach(ref => {
    const fk = ref.split(':')[0];
    fileKeyCounts[fk] = (fileKeyCounts[fk] || 0) + 1;
});
for (const [fk, count] of Object.entries(fileKeyCounts)) {
    console.log(`  ${fk}: ${count} references`);
}