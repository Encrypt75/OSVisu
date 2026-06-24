def fcfs_disk (request, initial_head):
    head_movement = 0
    current_head = initial_head

    for req in request:
        distance = abs(req - current_head)
        head_movement += distance

        current_head = req
    return head_movement

def sstf_disk(requests, initial_head):
    remaining_reqs = list(requests)
    total_head_movement = 0
    current_head = initial_head
    
    while len(remaining_reqs) > 0:       
        closest_req = min(remaining_reqs, key=lambda track: abs(track - current_head))      
        total_head_movement += abs(closest_req - current_head)              
        current_head = closest_req        
        remaining_reqs.remove(closest_req)
        
    return total_head_movement