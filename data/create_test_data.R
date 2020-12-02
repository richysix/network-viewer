library(tidyverse)

# make an initial mini network
set.seed(253)
num_nodes <- 10
tmp_node_data <- data.frame(
  node_idx = 0:(num_nodes - 1),
  id = 0:(num_nodes - 1),
  gene_id = sprintf('ENSTEST%011d', seq_len(num_nodes)),
  gene_name = sprintf('gene-%d', seq_len(num_nodes)),
  cluster_id = sample(0:19, num_nodes, replace = TRUE))

write_csv(tmp_node_data, path = 'nodes-test-mini.csv')

num_edges <- 20
tmp_edge_data <- data.frame(
  edge_idx = 0:(num_edges - 1),
  source = sample(tmp_node_data$id, num_edges, replace = TRUE),
  target = sample(tmp_node_data$id, num_edges, replace = TRUE),
  weight = runif(num_edges, min = 0.6, max = 1))
# remove self edges
tmp_edge_data <- tmp_edge_data[ tmp_edge_data$source != tmp_edge_data$target, ]
# remove duplicate edges
tmp_edge_data <- tmp_edge_data[ rownames(unique(tmp_edge_data[, c('source', 'target')])), ]

write_csv(tmp_edge_data, path = 'edges-test-mini.csv')

set.seed(652)
num_nodes <- 1000
tmp_node_data <- data.frame(
  node_idx = 0:(num_nodes - 1),
  id = 0:(num_nodes - 1),
  gene_id = sprintf('ENSTEST%011d', seq_len(num_nodes)),
  gene_name = sprintf('gene-%d', seq_len(num_nodes)),
  cluster_id = sample(0:19, num_nodes, replace = TRUE))

write_csv(tmp_node_data, path = 'nodes-test.csv')

num_edges <- 5000
tmp_edge_data <- data.frame(
  edge_idx = 0:(num_edges - 1),
  source = sample(tmp_node_data$id, num_edges, replace = TRUE),
  target = sample(tmp_node_data$id, num_edges, replace = TRUE),
  weight = runif(num_edges, min = 0.6, max = 1))
# remove self edges
tmp_edge_data <- tmp_edge_data[ tmp_edge_data$source != tmp_edge_data$target, ]
# remove duplicate edges
tmp_edge_data <- tmp_edge_data[ rownames(unique(tmp_edge_data[, c('source', 'target')])), ]

write_csv(tmp_edge_data, path = 'edges-test.csv')
