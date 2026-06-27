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
    if not requests:
        return {"sequence": [], "total_movement": 0}

    total_movement = 0
    current_head = initial_head
    sequence = []

    if strategy == "fcfs":
        for req in requests:
            total_movement += abs(req - current_head)
            sequence.append(req)
            current_head = req

    elif strategy == "sstf":
        remaining = list(requests)
        while remaining:
            closest = min(remaining, key=lambda r: abs(r - current_head))
            total_movement += abs(closest - current_head)
            sequence.append(closest)
            current_head = closest
            remaining.remove(closest)

    elif strategy in ["scan", "look"]:
        left = [r for r in requests if r < initial_head]
        right = [r for r in requests if r >= initial_head]
        
        left.sort(reverse=True)
        right.sort()

        if direction == "right":
            for req in right:
                sequence.append(req)
                total_movement += abs(req - current_head)
                current_head = req
            
            if left:
                if strategy == "scan":
                    end_track = disk_size - 1
                    if current_head != end_track:
                        sequence.append(end_track)
                        total_movement += abs(end_track - current_head)
                        current_head = end_track
                
                for req in left:
                    sequence.append(req)
                    total_movement += abs(req - current_head)
                    current_head = req
        else:
            for req in left:
                sequence.append(req)
                total_movement += abs(req - current_head)
                current_head = req
            
            if right:
                if strategy == "scan":
                    if current_head != 0:
                        sequence.append(0)
                        total_movement += abs(0 - current_head)
                        current_head = 0
                
                for req in right:
                    sequence.append(req)
                    total_movement += abs(req - current_head)
                    current_head = req

    elif strategy in ["c_scan", "c_look"]:
        left = [r for r in requests if r < initial_head]
        right = [r for r in requests if r >= initial_head]
        
        left.sort()
        right.sort()

        if direction == "right":
            for req in right:
                sequence.append(req)
                total_movement += abs(req - current_head)
                current_head = req
            
            if left:
                if strategy == "c_scan":
                    end_track = disk_size - 1
                    if current_head != end_track:
                        sequence.append(end_track)
                        total_movement += abs(end_track - current_head)
                        current_head = end_track
                    
                    sequence.append(0)
                    total_movement += abs(end_track - 0)
                    current_head = 0
                else:
                    total_movement += abs(left[0] - current_head)
                    current_head = left[0]
                
                for req in left:
                    sequence.append(req)
                    total_movement += abs(req - current_head)
                    current_head = req
        else:
            left_desc = sorted(left, reverse=True)
            for req in left_desc:
                sequence.append(req)
                total_movement += abs(req - current_head)
                current_head = req
                
            if right:
                right_desc = sorted(right, reverse=True)
                if strategy == "c_scan":
                    if current_head != 0:
                        sequence.append(0)
                        total_movement += abs(0 - current_head)
                        current_head = 0
                    
                    end_track = disk_size - 1
                    sequence.append(end_track)
                    total_movement += abs(end_track - 0)
                    current_head = end_track
                else:
                    total_movement += abs(right_desc[0] - current_head)
                    current_head = right_desc[0]
                
                for req in right_desc:
                    sequence.append(req)
                    total_movement += abs(req - current_head)
                    current_head = req

    return {"sequence": sequence, "total_movement": total_movement}
                


        

