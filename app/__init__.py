from flask import Flask, send_from_directory

def create_app():
    app = Flask(__name__, static_folder='osvisu-app/dist', static_url_path='/')

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
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/<path:path>")
    def static_proxy(path):
        return send_from_directory(app.static_folder, path)

    return app