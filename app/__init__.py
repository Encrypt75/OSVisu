from flask import Flask, send_from_directory, render_template
import json
import os
import time

# #region agent log
_LOG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "debug-dc587c.log")


def _debug_log(location, message, data=None, hypothesis_id=""):
    entry = {
        "sessionId": "dc587c",
        "timestamp": int(time.time() * 1000),
        "location": location,
        "message": message,
        "data": data or {},
        "runId": "post-fix",
        "hypothesisId": hypothesis_id,
    }
    with open(_LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


# #endregion

def create_app():
    app = Flask(__name__)

    from app.routes.cpu_routes import cpu_bp
    from app.routes.memory_routes import memory_bp
    from app.routes.page_routes import page_bp
    from app.routes.disk_routes import disk_bp

    app.register_blueprint(cpu_bp)
    app.register_blueprint(memory_bp)
    app.register_blueprint(page_bp)
    app.register_blueprint(disk_bp)

    @app.route("/")
    def index():
        react_index = os.path.join(app.root_path, "osvisu-app", "dist", "index.html")
        react_exists = os.path.exists(react_index)
        # #region agent log
        _debug_log(
            "__init__.py:index",
            "Serving homepage",
            {"react_dist_exists": react_exists, "react_index": react_index},
            "F1",
        )
        # #endregion
        if react_exists:
            return send_from_directory(os.path.join(app.root_path, "osvisu-app", "dist"), "index.html")
        return render_template("index.html")

    @app.route("/<path:path>")
    def static_proxy(path):
        # Try serving from the React build folder first
        react_file = os.path.join(app.root_path, "osvisu-app", "dist", path)
        if os.path.exists(react_file):
            # #region agent log
            _debug_log(
                "__init__.py:static_proxy",
                "Serving React asset",
                {"path": path},
                "F3",
            )
            # #endregion
            return send_from_directory(os.path.join(app.root_path, "osvisu-app", "dist"), path)
            
        # Otherwise fallback to standard app static folder
        static_file = os.path.join(app.root_path, "static", path)
        if os.path.exists(static_file):
            return send_from_directory(os.path.join(app.root_path, "static"), path)

        # #region agent log
        _debug_log(
            "__init__.py:static_proxy",
            "Asset not found",
            {"path": path},
            "F3",
        )
        # #endregion
        return "Not Found", 404

    return app
