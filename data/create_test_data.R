set.seed(652)
num_nodes <- 1000
tmp_node_data <- data.frame(id = sprintf('ENSTEST%011d', seq_len(num_nodes)),
                            name = sprintf('gene-%d', seq_len(num_nodes)),
                            cluster = sample(0:19, num_nodes, replace = TRUE))

write.csv(tmp_node_data, file = 'nodes-test.csv')

num_edges <- 5000
tmp_edge_data <- data.frame(source = sample(tmp_node_data$id, num_edges, replace = TRUE),
                            target = sample(tmp_node_data$id, num_edges, replace = TRUE),
                            value = runif(num_edges, min = 0.6, max = 1))
# remove self edges
tmp_edge_data <- tmp_edge_data[ tmp_edge_data$source != tmp_edge_data$target, ]
# remove duplicate edges
tmp_edge_data <- tmp_edge_data[ rownames(unique(tmp_edge_data[, c('source', 'target')])), ]

write.csv(tmp_edge_data, file = 'edges-test.csv')
