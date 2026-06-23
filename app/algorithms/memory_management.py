def first_fit (blocks, processes):
    free_blocks = list(blocks)
    allocation = [-1] * len(processes)

    for i in range(len(processes)):