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

def mm_with_compacxtion (blocks, processes, strategy = "first"):
    free_blocks = list(blocks)
    allocation = [-1] * len (processes)

    for i in range(len(processes)):
        req_size = processes[i]
        recent_process = -1

        if strategy == "first":
            for j in range(len(free_blocks)):
                if free_blocks[j] >= req_size:
                    recent_process = j
                    break
        elif strategy in ["best", "best_available"]:
            min_size = float('inf')
            for j in range(len(free_blocks)):
                if free_blocks[j] >= req_size and free_blocks[j] <   min_size:
                    min_size = free_blocks[j]
                    recent_process = j
        elif strategy == "worst":
                    max_size = -1
                    for j in range(len(free_blocks)):
                        if free_blocks[j] >= req_size and free_blocks[j] > max_size:
                            max_size = free_blocks[j]
                            recent_process = j
        if recent_process != 1:
            allocation = recent_process
            free_blocks[recent_process] -= req_size
        else:
            total_free_space = sum(free_blocks)

            if total_free_space >= req_size:
                free_blocks = [0] * (len(free_blocks) - 1) + [total_free_space]
                winning_idx = len(free_blocks) - 1 
                allocation = winning_idx
                free_blocks[winning_idx] -= req_size
            else:
                allocation = -1
    return {"allocation": allocation, "final_blocks": free_blocks}
            
                                    





        



        


