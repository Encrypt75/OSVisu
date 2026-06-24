class PageReplacement:

    def __init__(self, reference_string, frame_count):
        self.reference_string = reference_string
        self.frame_count = frame_count

        self.frames = []
        self.page_faults = 0
        self.page_hits = 0
        self.steps = []

    def record_step(self, page, status, replaced=None):
        self.steps.append({
            "page": page,
            "frames": self.frames.copy(),
            "status": status,
            "replaced": replaced,
        })

    def results(self):
        total = len(self.reference_string)

        return {
            "steps": self.steps,
            "page_faults": self.page_faults,
            "page_hits": self.page_hits,
            "hit_ratio": round(self.page_hits / total, 3) if total else 0,
            "fault_ratio": round(self.page_faults / total, 3) if total else 0,
        }


class FIFO(PageReplacement):

    def run(self):
        pointer = 0

        for page in self.reference_string:
            if page in self.frames:
                self.page_hits += 1
                self.record_step(page, "Hit")
                continue

            self.page_faults += 1

            if len(self.frames) < self.frame_count:
                self.frames.append(page)
            else:
                victim = self.frames[pointer]
                self.frames[pointer] = page

                self.record_step(page, "Fault", victim)

                pointer = (pointer + 1) % self.frame_count
                continue

            self.record_step(page, "Fault")

        return self.results()


class LRU(PageReplacement):

    def run(self):
        recent = {}

        for time, page in enumerate(self.reference_string):
            if page in self.frames:
                self.page_hits += 1
                recent[page] = time
                self.record_step(page, "Hit")
                continue

            self.page_faults += 1

            if len(self.frames) < self.frame_count:
                self.frames.append(page)
            else:
                victim = min(self.frames, key=lambda x: recent[x])
                victim_index = self.frames.index(victim)
                self.frames[victim_index] = page

                self.record_step(page, "Fault", victim)

                recent[page] = time
                continue

            recent[page] = time
            self.record_step(page, "Fault")

        return self.results()


class Optimal(PageReplacement):

    def run(self):
        for current_index, page in enumerate(self.reference_string):
            if page in self.frames:
                self.page_hits += 1
                self.record_step(page, "Hit")
                continue

            self.page_faults += 1

            if len(self.frames) < self.frame_count:
                self.frames.append(page)
            else:
                future = self.reference_string[current_index + 1:]

                victim = None
                farthest = -1

                for frame_page in self.frames:
                    if frame_page not in future:
                        victim = frame_page
                        break

                    next_use = future.index(frame_page)

                    if next_use > farthest:
                        farthest = next_use
                        victim = frame_page

                victim_index = self.frames.index(victim)
                self.frames[victim_index] = page

                self.record_step(page, "Fault", victim)
                continue

            self.record_step(page, "Fault")

        return self.results()


class LFU(PageReplacement):

    def run(self):
        frequency = {}

        for page in self.reference_string:
            frequency.setdefault(page, 0)

            if page in self.frames:
                self.page_hits += 1
                frequency[page] += 1
                self.record_step(page, "Hit")
                continue

            self.page_faults += 1

            if len(self.frames) < self.frame_count:
                self.frames.append(page)
            else:
                victim = min(self.frames, key=lambda x: frequency[x])
                victim_index = self.frames.index(victim)
                self.frames[victim_index] = page

                self.record_step(page, "Fault", victim)
                frequency[page] += 1
                continue

            frequency[page] += 1
            self.record_step(page, "Fault")

        return self.results()


def run_simulation(algorithm, pages, frame_count):
    algorithms = {
        "fifo": FIFO,
        "lru": LRU,
        "optimal": Optimal,
        "lfu": LFU,
    }

    algo_class = algorithms.get(algorithm, FIFO)
    return algo_class(pages, frame_count).run()


def frontend_format(result):
    history = []
    for step in result["steps"]:
        history.append({
            "page": step["page"],
            "frames": step["frames"],
            "fault": step["status"] == "Fault",
            "replaced": step.get("replaced"),
        })

    return {
        "faults": result["page_faults"],
        "hits": result["page_hits"],
        "hit_ratio": result["hit_ratio"],
        "fault_ratio": result["fault_ratio"],
        "history": history,
        "steps": result["steps"],
    }
