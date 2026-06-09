from flask import Blueprint, render_template

disk_bp = Blueprint("disk", __name__, url_prefix="/disk")


@disk_bp.route("/")
def disk_page():
    return render_template("disk.html")
