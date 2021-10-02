from datetime import date

from app import db


class ArkanoidScore(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    score = db.Column(db.Integer)
    date = db.Column(db.Date, nullable=False, default=date.today())

    def as_dict(self):
        dict_ = {"username": getattr(self, "username"),
                 "score": getattr(self, "score"),
                 "date": getattr(self, "date").strftime("%d.%m.%y")}
        return dict_


db.create_all()
db.session.commit()
