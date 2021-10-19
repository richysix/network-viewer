#!/usr/bin/env python3
''' Script to convert the results from PGCNA to the correct format for
network-viewer
Expects the gzipped nodes and edges files and a cluster list'''
import argparse
import sys
import gzip

def main(args):
    ''' Main body of code '''
    
    # open annotation file
    annotation_info = dict()
    with open(args.annotation) as annotation_f:
        for line in annotation_f:
            line = line.rstrip().split("\t")
            annotation_info[line[0]] = line
    if args.debug > 1:
        print("Annotation dict:", annotation_info)
    
    # load cluster info
    cluster_num_for = dict()
    with open(args.cluster_list) as clusters_f:
        header = clusters_f.readline()
        if args.debug > 1:
            print("Cluster List header:", header)
        
        for line in clusters_f:
            line = line.rstrip().split(",")
            cluster_num_for[line[0]] = line[1]
    
    if args.debug > 1:
        print("Cluster Info dict:", cluster_num_for)
    
    # open output nodes file
    with open(args.nodes_output_file, 'w') as nodes_out:
        # print header
        print(f"node_idx,id,gene_id,gene_name,cluster_id", file = nodes_out)
        id_for = dict() # dictionary to keep node ids
        current_idx = 0;
        # open nodes file and read in input
        with gzip.open(args.nodes_file, 'rt') as nodes_in:
            nodes_header = nodes_in.readline()
            for line in nodes_in:
                line = line.rstrip().split("\t")
                gene_id = line[0]
                id_for[gene_id] = current_idx
                current_idx = current_idx + 1
                # get gene name for id
                if gene_id in annotation_info.keys():
                    gene_info = annotation_info[gene_id]
                    gene_name = gene_info[6]
                else:
                    print(f"Warning: Gene id, {gene_id} was not found in the annotation", file=sys.stderr)
                    gene_name = 'NA'
                # get clutser num for id
                if gene_id in cluster_num_for.keys():
                    cluster_num = cluster_num_for[gene_id]
                else:
                    print(f"Warning: Could not find cluster number for {gene_id}.", file=sys.stderr)
                    cluster_num = 'NA'
                print(f"{id_for[gene_id]},{id_for[gene_id]},{gene_id},{gene_name},{cluster_num}", file = nodes_out)
    
    with open(args.edges_output_file, 'w') as edges_out:
        # print header
        print(f"edge_idx,target,source,weight", file = edges_out)
        gene_ids = id_for.keys()
        edge_idx = 0
        # open edges file and read in input
        with gzip.open(args.edges_file, 'rt') as edges_in:
            edges_header = edges_in.readline()
            for line in edges_in:
                line = line.rstrip().split("\t")
                # get node ids for source and target
                if line[0] in gene_ids:
                    source_idx = id_for[line[0]]
                else:
                    raise KeyError(f"Couldn't find node id for gene, {line[0]}")
                if line[1] in gene_ids:
                    target_idx = id_for[line[1]]
                else:
                    raise KeyError(f"Couldn't find node id for gene, {line[1]}")
                
                print(f"{edge_idx},{source_idx},{target_idx},{line[2]}", file = edges_out)
                edge_idx = edge_idx + 1

    
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='')
    parser.add_argument('nodes_file', default='RetainF0.8_EPG3_Nodes.tsv.gz',
        type=str,  help='Name of the gzipped Nodes files')
    parser.add_argument('edges_file', default='RetainF0.8_EPG3_Edges.tsv.gz',
        type=str,  help='Name of the gzipped Edges files')
    parser.add_argument('annotation', default='annotation.txt',
        type=str,  help='Name of the gene annotation file')
    parser.add_argument('cluster_list', default='1.csv',
        type=str,  help='Name of the nodes to clusters file')
    parser.add_argument('--nodes_output_file', action='store',
        type=str, default='nodes.csv',
        help='Name of the output for the nodes')
    parser.add_argument('--edges_output_file', action='store',
        type=str, default='edges.csv',
        help='Name of the output for the edges')
    parser.add_argument('--debug', action='count', default=0,
        help='Prints debugging information')
    args = parser.parse_args()
    if args.debug > 0:
        print('Nodes filename:', args.nodes_file)
        print('Edges filename:', args.edges_file)
        print('Annotation filename:', args.annotation)
        print('Clusters filename:', args.cluster_list)
        print('Nodes output filename:', args.nodes_output_file)
        print('Edges output filename:', args.edges_output_file)
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
