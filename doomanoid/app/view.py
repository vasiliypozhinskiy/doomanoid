from datetime import datetime
from urllib.parse import unquote

from flask import render_template, jsonify, request
from sqlalchemy import func

from app import app
from app.arkanoid_cfg import arkanoidConfig
from app.models import ArkanoidScore
from app.level_generation import generate_default_lvl, generate_lvl_with_arachnotrons
from app import db


@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')


@app.route('/arkanoid', methods=['POST', 'GET'])
def show_arkanoid():
    return render_template('/arkanoid.html')


@app.route('/get_config')
def get_config():
    return jsonify(config=arkanoidConfig)


@app.route('/generate_arkanoid_lvl')
def generate_lvl():
    lvl = int(request.args["lvl"])
    if lvl % 5 == 3:
        bricks, bonuses, enemies = generate_lvl_with_arachnotrons(lvl)
    else:
        bricks, bonuses, enemies = generate_default_lvl(lvl)
    return jsonify(bricks=bricks, bonuses=bonuses, enemies=enemies)


@app.route('/add_score', methods=['POST'])
def add_score():
    score = int(request.form["score"])
    user = unquote(request.form["user"])
    date = datetime.fromtimestamp(int(request.form["date"]) / 1000)
    record = ArkanoidScore(username=user, score=score, date=date)
    db.session.add(record)
    db.session.commit()
    return "", 204


@app.route('/show_user_result')
def show_user_result():
    current_username = request.args['username']
    current_score = int(request.args['score'])
    rows = ArkanoidScore.query.with_entities(
        func.row_number().over(order_by=ArkanoidScore.score.desc()).label('number'), ArkanoidScore.username, ArkanoidScore.score
    )

    rows_as_dict = []
    for row in rows:
        rows_as_dict.append(row._asdict())

    index_of_current = next(i for i, row_as_dict in enumerate(rows_as_dict)
                            if row_as_dict['username'] == current_username and row_as_dict['score'] == current_score)
    page_index = index_of_current // 20 + 1
    page_rows, has_prev, has_next = get_score_by_page(page_index)
    result = {
        'page_rows': page_rows,
        'page_index': page_index,
        'has_prev': has_prev,
        'has_next': has_next
    }

    return jsonify(result)


@app.route('/show_score_page')
def show_score_page():
    page_index = int(request.args['page_index'])
    page_rows, has_prev, has_next = get_score_by_page(page_index)
    result = {
        'page_rows': page_rows,
        'has_prev': has_prev,
        'has_next': has_next
    }
    return jsonify(result)


def get_score_by_page(page_index):
    page_rows = ArkanoidScore.query.with_entities(
        func.row_number().over(order_by=ArkanoidScore.score.desc()).label('number'), ArkanoidScore.username,
        ArkanoidScore.score, ArkanoidScore.date
    ).paginate(int(page_index), 20, False)

    result = []
    for row in page_rows.items:
        row_as_dict = row._asdict()
        row_as_dict['date'] = row_as_dict['date'].strftime("%d.%m.%y")
        result.append(row_as_dict)

    result.sort(key=lambda element: element['number'])
    return result, page_rows.has_prev, page_rows.has_next


