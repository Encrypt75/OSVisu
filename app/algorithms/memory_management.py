def mm_with_compaction (blocks, processes, strategy = "first"):
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
        if recent_process != -1:
            allocation[i] = recent_process
            free_blocks[recent_process] -= req_size
        else:
            total_free_space = sum(free_blocks)

            if total_free_space >= req_size:
                free_blocks = [0] * (len(free_blocks) - 1) + [total_free_space]
                winning_idx = len(free_blocks) - 1 
                allocation[i] = winning_idx
                free_blocks[winning_idx] -= req_size
            else:
                allocation[i] = -1
    return {"allocation": allocation, "final_blocks": free_blocks}

            
def mm_without_compaction(blocks, processes, strategy="first"):
    free_blocks = list(blocks)
    allocation = [-1] * len(processes)

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
                if free_blocks[j] >= req_size and free_blocks[j] < min_size:
                    min_size = free_blocks[j]
                    recent_process = j
        
        elif strategy == "worst":
            max_size = -1
            for j in range(len(free_blocks)):
                if free_blocks[j] >= req_size and free_blocks[j] > max_size:
                    max_size = free_blocks[j]
                    recent_process = j
        
        if recent_process != -1:
            allocation[i] = recent_process
            free_blocks[recent_process] -= req_size
        
        else:
            allocation[i] = -1
    return {"allocation": allocation, "final_blocks": free_blocks}
            

        


                                    





        



        


