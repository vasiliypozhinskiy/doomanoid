import random
from datetime import datetime
from urllib.parse import unquote

from flask import Blueprint, render_template, jsonify, request

from app import app
from app.arkanoid_cfg import arkanoidConfig
from app.models import ArkanoidScore
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
    bricks = []
    while not bricks:
        for i in range(8):
            for j in range(4):
                x = i * (arkanoidConfig["BRICK_WIDTH"] + arkanoidConfig["BRICK_OFFSET_X"]) + 40
                y = j * (arkanoidConfig["BRICK_HEIGHT"] + arkanoidConfig["BRICK_OFFSET_Y"]) + arkanoidConfig["BRICK_OFFSET_Y"] + 20
                new_brick = generate_brick(x, y, lvl)
                if new_brick:
                    bricks.append(new_brick)
    bonuses = []
    enemies = []
    enemies = enemies + generate_barons(bricks, lvl // 5)
    if lvl < 5:
        enemies = enemies + generate_enemies(bricks, lvl)
    elif lvl < 15:
        enemies = enemies + generate_enemies(bricks, 2 + lvl // 2)
    else:
        enemies = enemies + generate_enemies(bricks, 10)

    for brick in bricks:
        if not brick["has_enemy"]:
            new_bonus = generate_bonus(brick)
            if new_bonus:
                bonuses.append(new_bonus)
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


@app.route('/show_score')
def show_score():
    query = db.session.query(ArkanoidScore).order_by(ArkanoidScore.score.desc())
    answer = []
    for score in query:
        score_dict = score.as_dict()
        if len(score_dict["username"]) > 30:
            excess_chars = len(score_dict["username"]) - 30
            score_dict["username"] = score_dict["username"][:-excess_chars]
        answer.append(score_dict)
    return jsonify(answer)


def generate_brick(x, y, lvl):
    seed = random.randint(0, 100)
    if seed <= 5 + 2 * lvl:
        brick = {"type": 'grey', "x": x, "y": y, "has_enemy": False}
    elif seed <= 30 + 2 * lvl:
        brick = {"type": 'brown', "x": x, "y": y, "has_enemy": False}
    else:
        seed = random.randint(0, 100)
        if seed <= 50:
            brick = {"type": 'default', "x": x, "y": y, "has_enemy": False}
        else:
            return None
    return brick


def generate_barons(bricks, count):
    top_bricks = [(brick, bricks.index(brick)) for brick in bricks if brick["y"] == arkanoidConfig["BRICK_OFFSET_Y"] + 20]
    seeds = []
    barons = []
    if count > len(top_bricks):
        count = len(top_bricks)
    while len(seeds) < count:
        seed = random.randint(0, len(top_bricks) - 1)
        if seed not in seeds:
            seeds.append(seed)
    for seed in seeds:
        enemy = {"type": "baron", "x": bricks[top_bricks[seed][1]]["x"], "y": bricks[top_bricks[seed][1]]["y"]}
        bricks[top_bricks[seed][1]]["has_enemy"] = True
        barons.append(enemy)
    return barons


def generate_enemies(bricks, count):
    enemies = []
    seeds = []
    if count > len(bricks):
        count = len(bricks)
    while len(seeds) < count:
        seed = random.randint(0, len(bricks) - 1)
        if seed not in seeds and not bricks[seed]["has_enemy"]:
            seeds.append(seed)
    for seed in seeds:
        random_enemy = random.randint(0, 100)
        if random_enemy >= 70:
            enemy = {"type": "imp", "x": bricks[seed]["x"], "y": bricks[seed]["y"]}
        else:
            enemy = {"type": "doomguy", "x": bricks[seed]["x"], "y": bricks[seed]["y"]}
        bricks[seed]["has_enemy"] = True
        enemies.append(enemy)
    return enemies


def generate_bonus(brick):
    seed = random.randint(0, 100)
    if seed >= 95:
        bonus = {"type": "life", "x": brick["x"], "y": brick["y"]}
    elif seed >= 90:
        bonus = {"type": "invisibility", "x": brick["x"], "y": brick["y"]}
    elif seed >= 85:
        bonus = {"type": "mega", "x": brick["x"], "y": brick["y"]}
    elif seed >= 75:
        bonus = {"type": "hp", "x": brick["x"], "y": brick["y"]}
    elif seed >= 70:
        bonus = {"type": "invulnerability", "x": brick["x"], "y": brick["y"]}
    elif seed >= 65:
        bonus = {"type": "speed", "x": brick["x"], "y": brick["y"]}
    elif seed >= 50:
        bonus = {"type": "barrel", "x": brick["x"], "y": brick["y"]}
    else:
        return None
    return bonus


