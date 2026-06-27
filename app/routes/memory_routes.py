from flask import Blueprint, render_template, request, jsonify
from app.algorithms.memory_management import mm_without_compaction

memory_bp = Blueprint("memory", __name__, url_prefix="/memory")


@memory_bp.route("/")
def memory_page():
    return render_template("memory.html")


@memory_bp.route("/simulate", methods=["POST"])
def simulate():
    data = request.get_json() or {}
    algorithm = data.get("algorithm", "first_fit")
    req_size = data.get("request", 0)
    blocks_input = data.get("blocks", [])

    block_sizes = [b["size"] if b.get("free", True) else 0 for b in blocks_input]

    strategy = "first"
    if "best" in algorithm:
        strategy = "best"
    elif "worst" in algorithm:
        strategy = "worst"

    res = mm_without_compaction(block_sizes, [req_size], strategy)
    block_index = res["allocation"][0]

    return jsonify({
        "block_index": block_index
    })

