from flask import Blueprint, render_template, request, jsonify
from app.algorithms.disk_scheduling import disk_scheduling

disk_bp = Blueprint("disk", __name__, url_prefix="/disk")


@disk_bp.route("/")
def disk_page():
    return render_template("disk.html")


@disk_bp.route("/simulate", methods=["POST"])
def simulate():
    data = request.get_json() or {}
    algorithm = data.get("algorithm", "fcfs")
    head = data.get("head", 53)
    requests = data.get("requests", [])

    res = disk_scheduling(requests, head, strategy=algorithm)
    
    sequence = res["sequence"]
    total_seek = res["total_movement"]
    
    movements = []
    current = head
    for req in sequence:
        movements.append({"from": current, "to": req})
        current = req
        
    return jsonify({
        "total_seek": total_seek,
        "order": sequence,
        "movements": movements
    })

