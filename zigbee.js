const main = async function () {
    console.log('Starting main function...');

    const zigbeeUpdate = await Homey.zigbee.runCommand({ command: 'UPDATE_NODES' });
    const data = await Homey.zigbee.getState();

    const homeyID = data.controllerState.panId;

    let nodes = Object.values(data.nodes).map((node) => ({
        name: encodeURIComponent(node.name),
        group: node.type.toLowerCase(),
        id: node.nwkAddr,
        nodeState: {
            id: node.nwkAddr
        }
    }));
    const edges = [];

    nodes = [
        {
            name: encodeURIComponent('Homey'),
            id: homeyID,
            group: 'coordinator',
            nodeState: {
                id: homeyID
            }
        },
        ...nodes
    ];

    if (data.controllerState && !data.controllerState.routes) {
        return 'No data found. Currently only Homey Pro (2016-2019) supported';
    } else {
        for (const [key, value] of Object.entries(data.controllerState.routes)) {
            if (typeof value === 'string') {
                edges.push({ from: parseInt(value), to: parseInt(key) });
            } else if (Array.isArray(value) && value.length > 0) {
                if (nodes.some((n) => n.id === parseInt(value[0]))) {
                    edges.push({ from: parseInt(value[0]), to: parseInt(key) });
                } else {
                    edges.push({ from: homeyID, to: parseInt(key) });
                }
            } else if (Array.isArray(value) && value.length === 0) {
                edges.push({ from: homeyID, to: parseInt(key) });
            } else {
                console.log('No routes found');
            }
        }

        const nodeIds = nodes.map((n) => n.id);
        const edgeIds = [...edges.map((e) => e.to), ...edges.map((e) => e.from)];

        nodeIds.forEach((id) => {
            if (!edgeIds.includes(id)) {
                edges.push({ from: homeyID, to: id });
            }
        });

        const buf = window.btoa(JSON.stringify({ nodes, edges })).toString('base64');
        return `https://martijnpoppen.github.io/com.homey.map.mesh#${buf}`;
    }
};

main();
