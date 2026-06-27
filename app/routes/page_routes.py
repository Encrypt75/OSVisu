from flask import Blueprint, render_template, request, jsonify
from app.algorithms.page_replacement import run_simulation, frontend_format

page_bp = Blueprint("page", __name__, url_prefix="/page")


@page_bp.route("/")
def page_page():
    return render_template("page.html")


@page_bp.route("/simulate", methods=["POST"])
def simulate():
    data = request.get_json() or {}
    algorithm = data.get("algorithm", "fifo")
    pages = data.get("pages", [])
    frames = data.get("frames", 3)

    raw_result = run_simulation(algorithm, pages, frames)
    result = frontend_format(raw_result)

    return jsonify(result)

