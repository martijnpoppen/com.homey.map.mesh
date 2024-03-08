const main = async function () {
    console.log('Starting main function...');
    
    let state = await Homey.zwave.getState();
    let data = await Homey.zwave.runCommand({
        command: 'getNetworkTopology'
    });
    
    let failed = Homey.zwave.runCommand({command: 'getFailedNodes'});

    let nodes = [];
    let edges = [];
    let homeyID = 1;

    for (const [key, value] of Object.entries(data)) {
        if (value.base === true) {
            homeyID = parseInt(key);
        }
    }

    for (const [key, value] of Object.entries(data)) {
        const nodeState = get(state, `zw_state.stats.node_${parseInt(key)}_network`, null);
        let group = parseInt(key) === homeyID ? 'coordinator' : 'router';

        // if (value.base === true) {
        //     group = 'disconnected';
        // }

        nodes.push({
            name: encodeURIComponent(value.name),
            group,
            id: parseInt(key),
            nodeState: {
                id: parseInt(key),
                ...nodeState
            }
        });


        const routes = value.props.route.reverse();
        let filteredRoutes = routes.filter((route) => route !== 0);

        if (!value.base && filteredRoutes.length) {
            filteredRoutes.unshift(parseInt(key));
            // start from 1 because we want to start from the second element
                for (let i = 1; i < filteredRoutes.length; i++) {
                    edges.push({
                        from: parseInt(filteredRoutes[i]),
                        to: parseInt(filteredRoutes[i - 1])
                    });

                    console.log(value.name, 'Adding edge from', parseInt(filteredRoutes[i]), 'to', parseInt(filteredRoutes[i - 1]));
                }
        } else if (!value.base) {
            edges.push({ from: homeyID, to: parseInt(key) });

            console.log(value.name, 'Adding edge from', homeyID, 'to', parseInt(key));
        }
    }
console.log({ nodes, edges })
    const buf = window.btoa(JSON.stringify({ nodes, edges })).toString('base64');
    return `https://martijnpoppen.github.io/com.homey.map.mesh#${buf}`;
};

const get = function (obj, dirtyPath, defaultValue) {
    if (obj === undefined || obj === null) return defaultValue;
    const path = typeof dirtyPath === 'string' ? dirtyPath.split('.') : dirtyPath;
    let objLink = obj;
    if (Array.isArray(path) && path.length) {
        for (let i = 0; i < path.length - 1; i++) {
            const currentVal = objLink[path[i]];
            if (currentVal !== undefined && currentVal !== null) {
                objLink = currentVal;
            } else {
                return defaultValue;
            }
        }
        const value = objLink[path[path.length - 1]];
        return value === undefined || value === null ? defaultValue : value;
    }
    return defaultValue;
};

main();
