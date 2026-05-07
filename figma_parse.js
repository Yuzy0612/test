const fs = require('fs');

const data = JSON.parse(fs.readFileSync('E:/aitest8/figma_raw.json', 'utf8'));
const doc = data.document;

console.log("=" .repeat(70));
console.log("PAGES");
console.log("=".repeat(70));
for (const page of doc.children) {
    console.log(`ID: ${page.id} | Name: ${page.name} | Type: ${page.type} | Children: ${page.children?.length || 0}`);
}

console.log("\n" + "=".repeat(70));
console.log("TOP-LEVEL NODES PER PAGE");
console.log("=".repeat(70));
for (const page of doc.children) {
    console.log(`\nPage: ${page.name}`);
    for (const node of page.children || []) {
        console.log(`  - ${node.name} (${node.type}, children: ${node.children?.length || 0})`);
    }
}

console.log("\n" + "=".repeat(70));
console.log("COMPONENTS AND COMPONENT SETS");
console.log("=".repeat(70));

function findComponents(node, pageName, results) {
    const type = node.type;
    if (type === 'COMPONENT_SET' || type === 'COMPONENT') {
        results.push({
            id: node.id,
            name: node.name,
            type: type,
            page: pageName,
            variantCount: type === 'COMPONENT_SET' ? (node.children?.length || 0) : 1
        });
    }
    if (node.children) {
        for (const child of node.children) {
            findComponents(child, pageName, results);
        }
    }
}

const allComponents = [];
for (const page of doc.children) {
    findComponents(page, page.name, allComponents);
}

const componentSets = allComponents.filter(c => c.type === 'COMPONENT_SET');
const standaloneComponents = allComponents.filter(c => c.type === 'COMPONENT');

console.log(`\nComponent Sets (${componentSets.length}):`);
for (const cs of componentSets.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`  [${cs.page}] ${cs.name} - ${cs.variantCount} variants (ID: ${cs.id})`);
}

console.log(`\nStandalone Components (${standaloneComponents.length}):`);
for (const c of standaloneComponents.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 200)) {
    console.log(`  [${c.page}] ${c.name} (ID: ${c.id})`);
}
if (standaloneComponents.length > 200) {
    console.log(`  ... and ${standaloneComponents.length - 200} more`);
}

console.log("\n" + "=".repeat(70));
console.log("VARIABLE COLLECTIONS");
console.log("=".repeat(70));
if (data.variableCollections && data.variableCollections.length > 0) {
    for (const vc of data.variableCollections) {
        console.log(`\nCollection: ${vc.name} (ID: ${vc.id})`);
        console.log(`  Modes: ${vc.modes?.map(m => m.name).join(', ') || 'none'}`);
        console.log(`  Variables (${vc.variables?.length || 0}):`);
        for (const v of (vc.variables || []).slice(0, 50)) {
            console.log(`    - ${v.name} (${v.resolvedType || 'unknown'}, ID: ${v.id})`);
        }
        if (vc.variables && vc.variables.length > 50) {
            console.log(`      ... and ${vc.variables.length - 50} more`);
        }
    }
} else {
    console.log("No variableCollections in file document (trying meta endpoint...)");
}

// Check for styles
console.log("\n" + "=".repeat(70));
console.log("TEXT STYLES");
console.log("=".repeat(70));
if (data.textStyles && data.textStyles.length > 0) {
    console.log(`Found ${data.textStyles.length} text styles`);
    for (const ts of data.textStyles.slice(0, 30)) {
        console.log(`  - ${ts.name} (${ts.fontFamily} ${ts.fontStyle}, ${ts.fontSize}px)`);
    }
} else {
    console.log("No text styles in response");
}

console.log("\n" + "=".repeat(70));
console.log("EFFECT STYLES");
console.log("=".repeat(70));
if (data.effectStyles && data.effectStyles.length > 0) {
    console.log(`Found ${data.effectStyles.length} effect styles`);
    for (const es of data.effectStyles.slice(0, 30)) {
        console.log(`  - ${es.name} (${es.effects?.length || 0} effects)`);
    }
} else {
    console.log("No effect styles in response");
}

// Get components meta
console.log("\n" + "=".repeat(70));
console.log("TRYING COMPONENTS ENDPOINT");
console.log("=".repeat(70));