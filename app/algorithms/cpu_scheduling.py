def fcfs(processes):
    """First-Come First-Served scheduling."""
    timeline = []
    time = 0
    for p in processes:
        if time < p["arrival"]:
            time = p["arrival"] # This if else will handle idle times
       
            start = time
            time += p["burst"]
            timeline.append({
                "pid": p["pid"],
                "start": start,
                "end": time,
            })
    return {"timeline": timeline, "total_time": time}


def sjf(processes):
    jobs = len(processes)
    time = 0
    complete = 0
    timeline  = []

    is_done = [False] * jobs # to prevent running completed jobs

    while complete < jobs:
        best_index = -1
        min_burst = float ('inf') 

        for i in range(jobs):
            if processes [i]["arrival"] <= time and is_done == False:
                if processes [i]["burst"] <  min_burst:
                    min_burst = processes[i]["burst"]
                    best_index = i

        if best_index != 1:
            start = time
            time += processes[best_index]["burst"]

        timeline.append ({
            "pid:": processes[best_index]["pid"]
            "start": start,
            "end": time 
        })            
                
        is_done [best_index] = True
        complete += 1 

    else:
        time += 1 
return {"timeline": timeline, "total_time": time}


def preemptive_sjf(processes):
    """Preemptive SJF / Shortest Remaining Time First."""
    jobs = [
        {
            "pid": p["pid"],
            "remaining": p["burst"],
            "arrival": p.get("arrival", i),
        }
        for i, p in enumerate(processes)
    ]
    time = 0
    timeline = []
    current = None
    completed = 0

    while completed < len(jobs):
        ready = [j for j in jobs if j["arrival"] <= time and j["remaining"] > 0]
        if not ready:
            if current:
                timeline.append({"pid": current[0], "start": current[1], "end": time})
                current = None
            time += 1
            continue

        pick = min(ready, key=lambda j: (j["remaining"], j["arrival"]))
        if current and current[0] != pick["pid"]:
            timeline.append({"pid": current[0], "start": current[1], "end": time})
            current = (pick["pid"], time)
        elif not current:
            current = (pick["pid"], time)

        pick["remaining"] -= 1
        time += 1
        if pick["remaining"] == 0:
            completed += 1
            timeline.append({"pid": pick["pid"], "start": current[1], "end": time})
            current = None

    return {"timeline": timeline, "total_time": time}


def round_robin(processes, quantum):
    """Round-Robin scheduling with given time quantum."""
    remaining = {p["pid"]: p["burst"] for p in processes}
    order = [p["pid"] for p in processes]
    timeline = []
    time = 0
    idx = 0

    while any(remaining[pid] > 0 for pid in order):
        pid = order[idx % len(order)]
        if remaining[pid] <= 0:
            idx += 1
            continue
        slice_time = min(quantum, remaining[pid])
        start = time
        time += slice_time
        remaining[pid] -= slice_time
        timeline.append({"pid": pid, "start": start, "end": time})
        idx += 1

    return {"timeline": timeline, "total_time": time}

def priority_scheduling(processes, quantum):
