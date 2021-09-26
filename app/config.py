import os

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.getenv('FLASKCV_SECRET_KEY')
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'postgresql://doomanoid_user:doomanoid_password@db:5432/flask_cv'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
