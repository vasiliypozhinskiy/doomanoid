from flask import Flask

from flask_sqlalchemy import SQLAlchemy

from .config import Config

app = Flask(__name__, instance_relative_config=True)

app.config.from_object(Config)

db = SQLAlchemy(app)







