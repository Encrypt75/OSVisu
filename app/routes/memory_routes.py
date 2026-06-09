from flask import Blueprint, render_template

memory_bp = Blueprint("memory", __name__, url_prefix="/memory")


@memory_bp.route("/")
def memory_page():
    return render_template("memory.html")
