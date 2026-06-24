def fifo_page_replacement (pages, capacity):
    memory_frames = []
    page_faults = 0

    for page in pages:
        if page not in memory_frames:
            page_faults += 1

        if len(memory_frames) < capacity:
            memory_frames.append(page)

        else:
            memory_frames.pop(0)
            memory_frames.append(page)
    return page_faults

def lru_page_replacement(pages, capacity):
    memory_frame = []
    page_faults = 0

    for page in pages:
        if page not in memory_frame:
            page_faults += 1
            if len(memory_frame) < capacity:
                memory_frame.append(page)
            else: 
                memory_frame.pop(0)
                memory_frame.append(page)
        else:
            memory_frame.remove(page)
            memory_frame.append(page)
    return page_faults

        


