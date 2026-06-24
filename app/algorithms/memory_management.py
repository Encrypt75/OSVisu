def first_fit (blocks, processes):
    free_blocks = list(blocks)
    allocation = [-1] * len(processes)

    for i in range(len(processes)):
        for j in range(len(freee_blocks)):
            if free_blocks >= processes[i]:
                allocation[i] = j
                free_blocks -= processes[i]
                break
    return allocation


