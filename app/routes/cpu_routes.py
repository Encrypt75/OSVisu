from flask import Blueprint, render_template, request, jsonify

from app.algorithms import cpu_scheduling

cpu_bp = Blueprint("cpu", __name__, url_prefix="/cpu")


@cpu_bp.route("/")
def cpu_page():
    return render_template("cpu.html")


@cpu_bp.route("/simulate", methods=["POST"])
def simulate():
    data = request.get_json() or {}
    algorithm = data.get("algorithm", "fcfs")
    processes = data.get("processes", [])
    quantum = data.get("quantum", 2)

    if algorithm == "rr":
        result = cpu_scheduling.round_robin(processes, quantum)
    elif algorithm == "sjf":
        result = cpu_scheduling.sjf(processes)
    elif algorithm == "ps":
        result = cpu_scheduling.preemptive_sjf(processes)
    else:
        result = cpu_scheduling.fcfs(processes)

    return jsonify(result)
