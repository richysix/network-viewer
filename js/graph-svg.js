const testing = false;
const mini = true;
const debug = true;
const width = 960, height = 960;

// set height and width of svg element
document.querySelector('#graph_svg').setAttribute("height", height);
document.querySelector('#graph_svg').setAttribute("width", width);

/// define readers
let reader1 = new FileReader();
let reader2 = new FileReader();

function load_nodes_file() {
    var file = document.querySelector('#nodes_file').files[0];
    if (debug) {
        console.log(document.querySelector('#nodes_file').files);
        console.log(file);
    }
    reader1.addEventListener("load", draw_network, false);
    if (file) {
      reader1.readAsText(file);
    }
}

function load_edges_file() {
    var file = document.querySelector('#edges_file').files[0];
    reader2.addEventListener("load", draw_network, false);
    if (file) {
      reader2.readAsText(file);
    }
}

// functions to set the types of the incoming data
convert_node_data_fields = function(d) {
    return {
        node_idx: parseInt(d.node_idx),
        id: parseInt(d.id),
        gene_id: d.gene_id,
        gene_name: d.gene_name,
        cluster_id: parseInt(d.cluster_id)
    };
};
convert_edge_data_fields = function(d) {
    return {
        edge_idx: parseInt(d.edge_idx),
        source: parseInt(d.source),
        target: parseInt(d.target),
        weight: parseFloat(d.weight)
    };
};

function draw_network() {
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
    
    // Add zoom
    const zoom = d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 40])
        .on("zoom", zoomed);    

    //set up the simulation 
    //nodes only for now 
    var simulation = d3.forceSimulation()
                        .nodes(node_data);
    //add forces
    //we're going to add a charge to each node 
    //also going to add a centering force
    simulation
        .force("charge_force", d3.forceManyBody())
        .force("center_force", d3.forceCenter(width / 2, height / 2));
    
    //Create the link force 
    //We need the id accessor to use named sources and targets 
    var link_force =  d3.forceLink(edge_data).id(function id(d) {return d.node_idx;});
    
    simulation.force("links", link_force);
    
    // Define the div for the tooltip
    var tooltip_div = d3.select("body").append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);
    
    //draw lines for the links 
    var links = svg.append("g")
          .attr("class", "links")
        .selectAll("line")
        .data(edge_data)
        .enter().append("line")
          .attr("stroke-width", 2);
    
    //draw circles for the nodes
    const node_unselected_color = "#eeeeee";
    var nodes = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(node_data)
            .enter()
            .append("circle")
            .attr("r", 10)
            .attr("fill", node_unselected_color)
            .attr("stroke", "#333333")
            .attr("cx", width / 2)
            .attr("cy", height / 2);
            
    const g = svg.selectAll("g");

    svg.call(zoom);

    simulation.on("tick", tickActions );
    
    nodes.on("click", colour_cluster);
    
    // Colours
    const scale = d3.scaleOrdinal(d3.schemeTableau10);
    function colour_cluster(d) {
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
    
    nodes.on("mouseover", node_info)
        .on("mouseout", function(){
            tooltip_div.transition()		
                .duration(500)		
                .style("opacity", 0);
        });
    
    function node_info(d) {
        box_width = 40 + d.gene_name.length*6 + 10;
        if (debug) {
            console.log(box_width);
        }
        tooltip_div.html("name = " + d.gene_name + "<br/>"  + "cluster = " + d.cluster_id)	
                    .style("left", (d3.event.pageX) + "px")		
                    .style("top", (d3.event.pageY - 28) + "px")
                    .style("width", box_width);
        tooltip_div.transition()
            .duration(200)
            .style("opacity", '.9');
    }
    
    function zoomed() {
        if (debug) {
            console.log(d3.event);
        }
        g.attr("transform", d3.event.transform);
    }
    
    // Add functions for Zoom In, Out and Reset
    d3.select("#zoom-in").on("click", function(){ svg.transition().call(zoom.scaleBy, 2); });
    d3.select("#zoom-out").on("click", function(){ svg.transition().call(zoom.scaleBy, 0.5); });
    d3.select("#reset").on("click", reset );
    function reset() {
        svg.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity,
          d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
        );
    }
    
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
}

