# network-viewer
App to view network graphs

## Controls

The app allows you to move the network around by clicking and dragging with the
mouse. Double clicking zooms in and the are also buttons to zoom in and out and
to reset the zoom.
Hovering over one of the nodes cretes a pop-up with information about the node
and clicking on the node colours the node by it's cluster membership. It also
colours all the other nodes in the same cluster.

## Data format

At the moment, the app expects the data as two comma-separated files with the
following headers

Nodes: node_idx,id,gene_id,gene_name,cluster_id
Edges: edge_idx,source,target,weight

