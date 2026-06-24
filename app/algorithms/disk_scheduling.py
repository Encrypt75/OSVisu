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
def disk_scheduling (requests, initial_head, disk_size = 200, direction='right', strategy="fcfs"):
    total_movement = 0
    current_head = initial_head
    sequence = []

    if strategy == "fcfs":
        for req in requests:
            distance = abs(req - current_head)
            total_movement += distance
            sequence.append(req)
            current_head = req
    elif strategy == "sstf":
        remaining_reqs = list(requests)
        while len(remaining_reqs) > 0:
            closest_req = min(remaining_reqs, key=lambda track: abs(track - current_head))
            total_movement += abs(closest_req - current_head)
            sequence.append(closest_req)
            current_head = closest_req
            remaining_reqs.remove(closest_req)       
    else: 
        left = [r for r in requests if r < initial_head]
        right = [r for r in requests if r >= initial_head]
    
    if strategy in ["scan", "look"]:
        left.sort(reverse=True)
        right.sort()
        
        for run in range(2):
            if direction == "right":
                for req in right:
                    sequence.append(req)
                    total_movement += abs(req - current_head)
                    current_head = req
                if strategy == "scan" and left:
                    end_track = disk_size - 1
                    total_movement += abs(end_track - current_head)
                    current_head = end_track
                direction = "left"
            elif direction == "left":
                for req in left:
                    sequence.append(req)
                    total_movement += abs(req - current_head)
                    current_head = req
                    
                if strategy == "scan" and right and current_head != 0:
                    total_movement += abs(0 - current_head)
                    current_head = 0
                
                direction = "right"
    elif strategy ["c_scan", "c_look"]:
        left.sort()
        right.sort()

        for req in right:
            sequence.append(req)
            total_movement += abs(req - current_head)
            current_head = req
        
        if left:
            if strategy == "c_scan":
                end_track = disk_size - 1
                total_head_movement += abs(end_track - current_head)
                total_head_movement += abs(end_track - 0)
                current_head = 0
            elif strategy == "c_look":
                total_movement += abs(left[0] - current_head)
                current_head = left[0]

            for req in left:
                    sequence.append(req)
                    total_head_movement += abs(req - current_head)
                    current_head = req
    return {"sequence": sequence, "total_movement": total_head_movement}                


        

