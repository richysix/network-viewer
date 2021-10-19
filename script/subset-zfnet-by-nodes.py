#!/usr/bin/env python3
''' Script to subset a network based on a list of nodes.
Expects csv nodes and edges files and a required nodes list'''
import argparse
import textwrap
import sys
import gzip

def main(args):
    ''' Main body of code '''
    
    # open nodes list files
    required_nodes = []
    with open(args.nodes_list) as nodes_list_f:
        for line in nodes_list_f:
            required_nodes.append(line.rstrip())
    if args.debug > 1:
        print("Required nodes:", required_nodes)
    
    # open output nodes file
    required_node_ids = []
    node_info_for = dict()
    with open(args.nodes_file) as nodes_in:
        nodes_header = nodes_in.readline()
        for line in nodes_in:
            node_info = line.rstrip().split(",")
            node_id = node_info[1]
            gene_id = node_info[2]
            # get gene name for id
            if gene_id in required_nodes:
                required_node_ids.append(node_id)
            # add all nodes to the node_info dictionary
            node_info_for[node_id] = node_info
    
    with open(args.edges_output_file, 'w') as edges_out:
        # print header
        print(f"edge_idx,target,source,weight", file = edges_out)
        # open edges file and read in input
        with open(args.edges_file) as edges_in:
            edges_header = edges_in.readline()
            for line in edges_in:
                edge_info = line.rstrip().split(",")
                # get node ids for source and target
                target_idx = edge_info[1]
                source_idx = edge_info[2]
                # check whether to keep this edge
                keep = False
                if args.mode == 'required_nodes_only':
                    if target_idx in required_node_ids and source_idx in required_node_ids:
                        keep = True
                else:
                    if target_idx in required_node_ids:
                        keep = True
                        if source_idx not in required_node_ids:
                            required_node_ids.append(source_idx)
                    else:
                        if source_idx in required_node_ids:
                            keep = True
                            required_node_ids.append(target_idx)
                
                if keep:
                    print(",".join(edge_info), file = edges_out)
    
    # output node info on required nodes
    with open(args.nodes_output_file, 'w') as nodes_out:
        # print header
        print(f"node_idx,id,gene_id,gene_name,cluster_id", file = nodes_out)
        for node_idx in required_node_ids:
            print(",".join(node_info_for[node_idx]), file = nodes_out)

    
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='''Script to subset a network based on a list of nodes.
Expects csv nodes and edges files and a required nodes list''',
                                     formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument('nodes_file', type=str,  help='Name of the Nodes csv file')
    parser.add_argument('edges_file', type=str,  help='Name of the Edges csv file')
    parser.add_argument('nodes_list', type=str,  help='Name of the file with the nodes to keep (Ensembl ids)')
    parser.add_argument('--nodes_output_file', action='store',
        type=str, default='nodes-subset.csv',
        help='Name of the output for the nodes (default: %(default)s)')
    parser.add_argument('--edges_output_file', action='store',
        type=str, default='edges-subset.csv',
        help='Name of the output for the edges (default: %(default)s)')
    help_text = ['The mode used to decide which edges to keep:',
                 'required_nodes_only -    only includes edges if both nodes are in the required nodes list',
                 'all_edges -              keeps any edges where either of the 2 nodes are in the required nodes list',
                 '(default: %(default)s)']
    parser.add_argument('--mode', choices = ['required_nodes_only', 'all_edges'],
                        action='store', type=str, default='required_nodes_only',
        help="\n".join(help_text))
    parser.add_argument('--debug', action='count', default=0,
        help='Prints debugging information')
    args = parser.parse_args()
    if args.debug > 0:
        print('Nodes filename:', args.nodes_file)
        print('Edges filename:', args.edges_file)
        print('Node list:', args.nodes_list)
        print('Nodes output filename:', args.nodes_output_file)
        print('Edges output filename:', args.edges_output_file)
        print('Mode:', args.mode)
    main(args)

# AUTHOR
#
# Richard White <rich@buschlab.org>
#
# COPYRIGHT AND LICENSE
#
# This software is Copyright (c) 2021. University of Cambridge.
#
# This is free software, licensed under:
#
#  The GNU General Public License, Version 3, June 2007
