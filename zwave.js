

const main = async function () {
  console.log("Starting main function...");

  //   let getNetworkTopology = await Homey.zwave.runCommand({command: 'getNetworkTopology'});
  //   let state = await Homey.zwave.getState();

  let nodes = [];
  let edges = [];
  let homeyID = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value.base === true) {
      homeyID = parseInt(key);
    }

    

    const nodeState = get(state, `zw_state.stats.node_${parseInt(key)}_network`, {})

    nodes.push({
      name: value.name,
      group: parseInt(key) === homeyID ? "coordinator" : "router",
      id: parseInt(key),
      nodeState
    });


    const routes = value.props.route.reverse();

    if (routes.some((route) => route !== 0)) {
      let filteredRoutes = routes.filter((route) => route !== 0);
      filteredRoutes.push(parseInt(key));
      for (var i = 0; i < filteredRoutes.length; i++) {
        if (i !== 0) {
          edges.push({
            from: parseInt(filteredRoutes[i]),
            to: parseInt(filteredRoutes[i - 1]),
          });
        }
      }
    } else {
      edges.push({ from: homeyID, to: parseInt(key) });
    }
  }

  const buf = window.btoa(JSON.stringify({ nodes, edges })).toString("base64");
  return `https://martijnpoppen.github.io/com.homey.map.mesh?data=${buf}`;
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
