from flask import Blueprint, render_template

page_bp = Blueprint("page", __name__, url_prefix="/page")


@page_bp.route("/")
def page_page():
    return render_template("page.html")
