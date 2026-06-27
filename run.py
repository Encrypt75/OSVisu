import json
import os
import shutil
import subprocess
import sys
import time
import traceback

# #region agent log
_LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "debug-dc587c.log")


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

def _ensure_frontend_built(app):
    react_dist = os.path.join(app.root_path, "osvisu-app", "dist", "index.html")
    if os.path.exists(react_dist):
        return True

    npm = shutil.which("npm")
    frontend_dir = os.path.join(app.root_path, "osvisu-app")
    if not npm or not os.path.isdir(frontend_dir):
        # #region agent log
        _debug_log(
            "run.py:build",
            "React build missing; cannot auto-build",
            {"npm_found": bool(npm), "frontend_dir": frontend_dir},
            "F1",
        )
        # #endregion
        return False

    # #region agent log
    _debug_log("run.py:build", "Auto-building React frontend", {"npm": npm}, "F1")
    # #endregion
    try:
        subprocess.run([npm, "install"], cwd=frontend_dir, check=True)
        subprocess.run([npm, "run", "build"], cwd=frontend_dir, check=True)
        built = os.path.exists(react_dist)
        # #region agent log
        _debug_log("run.py:build", "Auto-build finished", {"success": built}, "F1")
        # #endregion
        return built
    except subprocess.CalledProcessError as exc:
        # #region agent log
        _debug_log("run.py:build", "Auto-build failed", {"error": str(exc)}, "F1")
        # #endregion
        return False


if __name__ == "__main__":
    # #region agent log
    _debug_log(
        "run.py:entry",
        "Starting OSVisu",
        {
            "cwd": os.getcwd(),
            "script_dir": os.path.dirname(os.path.abspath(__file__)),
            "sys_path_head": sys.path[:3],
            "python": sys.executable,
        },
        "A",
    )
    # #endregion

    try:
        from app import create_app

        # #region agent log
        _debug_log("run.py:import", "create_app imported successfully", {}, "A")
        # #endregion

        app = create_app()
        _ensure_frontend_built(app)

        react_dist = os.path.join(app.root_path, "osvisu-app", "dist", "index.html")
        # #region agent log
        _debug_log(
            "run.py:create_app",
            "Flask app created",
            {
                "root_path": app.root_path,
                "route_count": len(list(app.url_map.iter_rules())),
                "react_dist_exists": os.path.exists(react_dist),
            },
            "F1",
        )
        # #endregion

        # #region agent log
        _debug_log("run.py:run", "Calling app.run(debug=True)", {}, "E")
        # #endregion

        app.run(debug=True)

    except Exception as exc:
        # #region agent log
        _debug_log(
            "run.py:error",
            "Startup failed",
            {"error": str(exc), "traceback": traceback.format_exc()},
            "A",
        )
        # #endregion
        raise
