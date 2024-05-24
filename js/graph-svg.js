const testing = false;
const mini = true;
const debug = true;
const width = 480, height = 480;
const charge_force_strength = -10;

// set height and width of svg element
document.querySelector('#graph-svg').setAttribute("height", height);
document.querySelector('#graph-svg').setAttribute("width", width);

/// define readers
let reader1 = new FileReader();
let reader2 = new FileReader();

function load_nodes_file() {
    var file = document.querySelector('#nodes-file').files[0];
    if (debug) {
        console.log(document.querySelector('#nodes-file').files);
        console.log(file);
    }
    reader1.addEventListener("load", draw_network, false);
    if (file) {
      reader1.readAsText(file);
    }
}

function load_edges_file() {
    var file = document.querySelector('#edges-file').files[0];
    reader2.addEventListener("load", draw_network, false);
    if (file) {
      reader2.readAsText(file);
    }
}

// functions to set the types of the incoming data
function convert_node_data_fields(d) {
    return {
        node_idx: parseInt(d.node_idx),
//        id: parseInt(d.id),
        gene_id: d.gene_id,
        gene_name: d.gene_name,
        cluster_id: parseInt(d.cluster_id)
    };
}

function convert_edge_data_fields(d) {
    return {
        edge_idx: parseInt(d.edge_idx),
        source: parseInt(d.source),
        target: parseInt(d.target),
        weight: parseFloat(d.weight)
    };
}

function reset_network() {
    d3.select("#graph-svg").selectAll("*").remove();
    //document.getElementById('nodes-file').value = '';
    //document.getElementById('edges-file').value = '';
    document.getElementById('filesform').reset();
    reader1.result = undefined;
    reader2.result = undefined;
    draw_network();
}
d3.select('#reset').on("click", reset_network);

function draw_network() {
    // reset the network
    d3.select("#graph-svg").selectAll("*").remove();

    if (!reader1.result || !reader2.result) {
        return;
    }
    
    let node_data = d3.csvParse(reader1.result, convert_node_data_fields);
    let edge_data = d3.csvParse(reader2.result, convert_edge_data_fields);

    if (debug) {
        console.log(node_data);
        console.log(edge_data);
    }
    
    const svg = d3.select("svg")
        .attr("viewBox", [0, 0, width, height]);
    
    //set up the simulation 
    //nodes only for now 
    const simulation = d3.forceSimulation()
                        .nodes(node_data);
    //add forces
    //we're going to add a charge to each node 
    //also going to add a centering force
    simulation
        .force("charge_force", d3.forceManyBody())
        //.force("charge_force", d3.forceManyBody().strength(charge_force_strength))
        .force("center_force", d3.forceCenter(width / 2, height / 2));
    
    //Create the link force 
    //We need the id accessor to use named sources and targets 
    var link_force =  d3.forceLink(edge_data).id(function id(d) {return d.node_idx;});
    //link_force.strength(function weight(d) {return d.weight / 10;});
    
    simulation.force("links", link_force);
    
    // Define the div for the tooltip
    var tooltip_div = d3.select("body").append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);
    
    //draw lines for the links 
    const links = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(edge_data)
        .enter().append("line")
          .attr("stroke-width", 2);
    
    //draw circles for the nodes
    const node_unselected_color = "#eeeeee";
    const nodes = svg.append("g")
        .attr("class", "nodes")
        .attr("cursor", "grab")
        .selectAll("circle")
        .data(node_data)
        .join("circle")
        .attr("r", 10)
        .attr("fill", node_unselected_color)
        .attr("stroke", "#333333")
        .attr("cx", width / 2)
        .attr("cy", height / 2);
    
    nodes.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
        .on("click", colour_cluster);

    function dragstarted(event, d) {
        if (debug) {
            console.log(d)
            console.log(this)
            console.log(event)
        }
        d3.select(this)
            .raise()
            .attr("fill", "#000000");
        nodes.attr("cursor", "grabbing");
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
        if (d3.select(this).classed("selected")) {
            d3.select(this)
                .attr("fill", scale(d.cluster_id));
        } else {
            d3.select(this)
                .attr("fill", node_unselected_color);
        }
        nodes.attr("cursor", "grab");
    }

    // Colours
    const scale = d3.scaleOrdinal(d3.schemeTableau10);
    function colour_cluster(event, d) {
        if (event.shiftKey) {
            cluster_idx = d.cluster_id;
            if (debug) {
                //console.log(d);
                console.log(cluster_idx);
            }
            if (d3.select(this).classed("selected")) {
                svg.selectAll("circle")
                .filter(function(d){ return d.cluster_id ==  cluster_idx ? this : null; })
                .attr("fill", node_unselected_color)
                .each(function(){ this.classList.toggle("selected"); });
            } else {
                svg.selectAll("circle")
                .filter(function(d){ return d.cluster_id ==  cluster_idx ? this : null; })
                .attr("fill", scale(d.cluster_id))
                .each(function(){ this.classList.toggle("selected"); });
            }
        }
        if (event.defaultPrevented) return; // dragged
    }

    // Add zoom
    const g = svg.selectAll("g");
    function zoomed({transform}) {
        g.attr("transform", transform);
    }
    const zoom = d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 40])
        .on("zoom", zoomed);    

    svg.call(zoom);

    function tickActions() {
        //update circle positions to reflect node updates on each tick of the simulation 
        nodes
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
        
        //update link positions 
        //simply tells one end of the line to follow one node around
        //and the other end of the line to follow the other node around
        links
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
    }
    simulation.on("tick", tickActions );

    nodes.on("mouseover", node_info)
        .on("mouseout", function(){
            tooltip_div.transition()		
                .duration(500)		
                .style("opacity", 0);
        });
    
    function node_info(event) {
        if (debug) {
            console.log(event)
            console.log(event.target.__data__)
        }
        d = event.target.__data__
        box_width = 40 + d.gene_name.length*6 + 10;
        if (debug) {
            console.log(box_width);
        }
        tooltip_div.html("name = " + d.gene_name + "<br/>"  + "cluster = " + d.cluster_id)	
                    .style("left", (event.pageX) + "px")		
                    .style("top", (event.pageY - 28) + "px")
                    .style("width", box_width);
        tooltip_div.transition()
            .duration(200)
            .style("opacity", '.9');
    }
    
    // Add functions for Zoom In, Out and Reset
    d3.select("#zoom-in").on("click", function(){ svg.transition().call(zoom.scaleBy, 2); });
    d3.select("#zoom-out").on("click", function(){ svg.transition().call(zoom.scaleBy, 0.5); });
    d3.select("#reset-zoom").on("click", reset);
    function reset() {
        svg.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity,
          d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
        );
    }
    
    invalidation.then(() => simulation.stop());
}

