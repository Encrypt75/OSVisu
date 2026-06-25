def fcfs(processes):
    """First-Come First-Served scheduling."""
    timeline = []
    time = 0
    for p in processes:
        if time < p.get("arrival", 0):
            time = p["arrival"]
        start = time
        time += p["burst"]
        timeline.append({
            "pid": p["pid"],
            "start": start,
            "end": time,
        })
    return {"timeline": timeline, "total_time": time}


def non_preemptive_sjf(processes):
    """Non-preemptive Shortest Job First scheduling."""
    jobs = [
        {
            "pid": p["pid"],
            "arrival": p.get("arrival", 0),
            "burst": p["burst"],
        }
        for p in processes
    ]
    n = len(jobs)
    time = 0
    complete = 0
    timeline = []
    is_done = [False] * n

    while complete < n:
        best_index = -1
        min_burst = float("inf")

        for i in range(n):
            if not is_done[i] and jobs[i]["arrival"] <= time:
                if jobs[i]["burst"] < min_burst:
                    min_burst = jobs[i]["burst"]
                    best_index = i

        if best_index == -1:
            time += 1
            continue

        start = time
        time += jobs[best_index]["burst"]
        timeline.append({
            "pid": jobs[best_index]["pid"],
            "start": start,
            "end": time,
        })
        is_done[best_index] = True
        complete += 1

    return {"timeline": timeline, "total_time": time}


def sjf(processes):
    """Alias for non-preemptive SJF."""
    return non_preemptive_sjf(processes)


def preemptive_sjf(processes):
    """Preemptive SJF / Shortest Remaining Time First."""
    jobs = [
        {
            "pid": p["pid"],
            "remaining": p["burst"],
            "arrival": p.get("arrival", 0),
        }
        for p in processes
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


def non_preemptive_priority(processes):
    time = 0
    completed = 0
    timeline = []

    jobs = [
        {
            "pid": p["pid"],
            "arrival": p.get("arrival", 0),
            "burst": p["burst"],
            "priority": p["priority"],
        }
        for p in processes
    ]
    while completed < len(jobs):
        highest_priority = -1
        chosen_job = None
        for job in jobs:
            if job["arrival"] <= time and job["burst"] > 0 and job["priority"] > highest_priority:
                highest_priority = job["priority"]
                chosen_job = job

        if not chosen_job:
            time += 1
            continue

        start = time
        time += chosen_job["burst"]
        chosen_job["burst"] = 0
        completed += 1

        timeline.append({
            "pid": chosen_job["pid"],
            "start": start,
            "end": time,
        })

    return {"timeline": timeline, "total_time": time}


def preemptive_priority(processes):
    time = 0
    completed = 0
    timeline = []

    jobs = [
        {
            "pid": p["pid"],
            "arrival": p.get("arrival", 0),
            "burst": p["burst"],
            "remaining": p["burst"],
            "priority": p["priority"],
        }
        for p in processes
    ]
    current = None

    while completed < len(jobs):
        highest_priority = -1
        chosen_job = None

        for job in jobs:
            if job["arrival"] <= time and job["remaining"] > 0 and job["priority"] > highest_priority:
                highest_priority = job["priority"]
                chosen_job = job

        if not chosen_job:
            if current:
                timeline.append({"pid": current[0], "start": current[1], "end": time})
                current = None
            time += 1
            continue

        if current and current[0] != chosen_job["pid"]:
            timeline.append({"pid": current[0], "start": current[1], "end": time})
            current = (chosen_job["pid"], time)
        elif not current:
            current = (chosen_job["pid"], time)

        chosen_job["remaining"] -= 1
        time += 1

        if chosen_job["remaining"] == 0:
            completed += 1
            timeline.append({"pid": chosen_job["pid"], "start": current[1], "end": time})
            current = None

    return {"timeline": timeline, "total_time": time}


def round_robin(processes, quantum):
    """Round-Robin scheduling with a dynamic ready queue."""
    jobs = [
        {
            "pid": p["pid"],
            "arrival": p.get("arrival", 0),
            "remaining": p["burst"],
        }
        for p in processes
    ]
    time = 0
    completed = 0
    timeline = []
    queue = []
    visited = set()

    while completed < len(jobs):
        for job in jobs:
            if job["arrival"] <= time and job["remaining"] > 0 and job["pid"] not in visited:
                queue.append(job["pid"])
                visited.add(job["pid"])

        if not queue:
            time += 1
            continue

        pid = queue.pop(0)
        active_job = None
        for j in jobs:
            if j["pid"] == pid:
                start = time
                slice_len = min(j["remaining"], quantum)
                time += slice_len
                j["remaining"] -= slice_len
                timeline.append({
                    "pid": j["pid"],
                    "start": start,
                    "end": time,
                })
                if j["remaining"] == 0:
                    completed += 1
                active_job = j

        for job in jobs:
            if job["arrival"] <= time and job["remaining"] > 0 and job["pid"] not in visited:
                queue.append(job["pid"])
                visited.add(job["pid"])

        if active_job and active_job["remaining"] > 0:
            queue.append(pid)

    return {"timeline": timeline, "total_time": time}
