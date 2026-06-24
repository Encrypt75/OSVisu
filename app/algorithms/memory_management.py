def first_fit (blocks, processes):
    free_blocks = list(blocks)
    allocation = [-1] * len(processes)

    for i in range(len(processes)):
        for j in range(len(free_blocks)):
            if free_blocks >= processes[i]:
                allocation[i] = j
                free_blocks -= processes[i]
                break
    return allocation

def best_fit (blocks, processes):
    free_blocks = list(blocks)
    allocation = [-1] * len(processes)

    for i in range (len(processes)):
        best_block = -1
        min_block = float('inf')

        for j in range(len(free_blocks)):
            if free_blocks[j] >= processes[i]:
                if free_blocks[j] < min_block:
                    min_block = free_blocks[j]
                    best_block = j
        if best_block != -1:
            allocation[i] = best_block
            free_blocks[best_block] -= processes[i]
    return allocation


def worst_fit (blocks, processes):
    free_blocks = list(blocks)
    allocation = [-1] * len(processes)

    for i in range(len(processes)):
        best_blocks = -1
        max_block = -1

        for j in range(len(free_blocks)):
            if free_blocks[j] >= processes[i] and free_blocks[j] > max_block:
                max_block = free_blocks[j]
                best_blocks = j
            
            if best_blocks != -1:
                allocation[i] = best_blocks
                free_blocks[best_blocks] -= processes[i]
    return allocation


