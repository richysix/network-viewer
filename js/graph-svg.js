const testing = true;
const debug = true;

if (testing) {
    nodes_data_file = "http://localhost:8010/data/nodes-test.csv";
    edges_data_file = "http://localhost:8010/data/edges-test.csv";
}
Promise.all([
    d3.csv(nodes_data_file),
    d3.csv(edges_data_file)
]).then(function(data) {
    draw_network(data[0], data[1]);
});

function draw_network(node_data, edge_data) {
    if (debug) {
        console.log(node_data);
        console.log(edge_data);
    }
    
    var svg = d3.select("svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height");
    
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
    var link_force =  d3.forceLink(edge_data)
                            .id(function(d) { return d.id; });
    
    simulation.force("links",link_force);
    
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
    
    simulation.on("tick", tickActions );
    
    nodes.on("click", colour_cluster);
    
    function colour_cluster(d) {
        cluster_idx = d.cluster;
        if (debug) {
            //console.log(d);
            console.log(cluster_idx);
        }
        if (d3.select(this).classed("selected")) {
            svg.selectAll("circle")
                .filter(function(d){ return d.cluster ==  cluster_idx ? this : null; })
                .attr("fill", node_unselected_color)
                .each(function(){ this.classList.toggle("selected"); });
        } else {
            svg.selectAll("circle")
                .filter(function(d){ return d.cluster ==  cluster_idx ? this : null; })
                .attr("fill", cluster_fill_colour(d))
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
        box_width = 40 + d.name.length*6 + 10;
        if (debug) {
            console.log(box_width);
        }
        tooltip_div.html("name = " + d.name + "<br/>"  + "cluster = " + d.cluster)	
                    .style("left", (d3.event.pageX) + "px")		
                    .style("top", (d3.event.pageY - 28) + "px")
                    .style("width", box_width);
        tooltip_div.transition()
            .duration(200)
            .style("opacity", '.9');
    }
    
    
    //create drag handler with d3.drag()
    //var drag_handler = d3.drag()
    //	.on("start", drag_start)
    //	.on("drag", drag_drag)
    //	.on("end", drag_end);
    //
    //function drag_start(d) {
    //  if (!d3.event.active) simulation.alphaTarget(0.3);
    //  d.fx = d.x;
    //  d.fy = d.y;
    //}    
    //
    //function drag_drag(d) {
    //  d.fx = d3.event.x;
    //  d.fy = d3.event.y;
    //}
    //
    //function drag_end(d) {
    //  if (!d3.event.active) simulation.alphaTarget(0);
    //  d.fx = d.x;
    //  d.fy = d.y;
    //}
    //
    ////apply the drag_handler to our circles 
    //drag_handler(nodes);
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
    
    // Colours
    const scale = d3.scaleOrdinal(d3.schemeTableau10);
    cluster_fill_colour = function(d) {
        if (debug) {
            console.log(d.cluster);
            console.log(scale(d.cluster));
        }
        return scale(d.cluster);
    }

}

