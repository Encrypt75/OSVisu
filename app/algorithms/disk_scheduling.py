def fcfs_disk (request, initial_head):
    head_movement = 0
    current_head = initial_head

    for req in request:
        distance = abs(req - current_head)
        head_movement += distance

        current_head = req
    return head_movement
