import random

from app.arkanoid_cfg import arkanoidConfig


def generate_default_lvl(lvl):
    bricks = generate_bricks(4, 8, 40, 60, lvl)
    bonuses = []
    enemies = generate_enemies(bricks, lvl)

    for brick in bricks:
        if not brick["has_enemy"]:
            new_bonus = generate_bonus(brick)
            if new_bonus:
                bonuses.append(new_bonus)
    return bricks, bonuses, enemies


def generate_lvl_with_arachnotrons(lvl):
    bricks = generate_bricks(4, 5, 120, 60, lvl)
    bricks_for_arachnotrons = [
        {"type": 'grey', "x": 10, "y": 100, "has_enemy": False},
        {"type": 'grey', "x": arkanoidConfig['CANVAS_WIDTH'] - arkanoidConfig['BRICK_WIDTH'] - 10, "y": 100, "has_enemy": False},
        {"type": 'grey', "x": 10, "y": 400, "has_enemy": False},
        {"type": 'grey', "x": arkanoidConfig['CANVAS_WIDTH'] - arkanoidConfig['BRICK_WIDTH'] - 10, "y": 400, "has_enemy": False},
    ]
    bonuses = []
    enemies = generate_enemies(bricks, lvl)
    count_of_arachnotrons = lvl // 5 + 5
    arachnotrons = generate_arachnotrons(bricks_for_arachnotrons, count_of_arachnotrons)
    return bricks + bricks_for_arachnotrons, bonuses, enemies + arachnotrons


def generate_bricks(number_of_rows, bricks_in_row, offset_by_x, offset_by_y, lvl):
    bricks = []
    while not bricks:
        for i in range(bricks_in_row):
            for j in range(number_of_rows):
                x = i * (arkanoidConfig["BRICK_WIDTH"] + arkanoidConfig['BRICK_OFFSET_X']) + offset_by_x
                y = j * (arkanoidConfig["BRICK_HEIGHT"] + arkanoidConfig['BRICK_OFFSET_Y']) + offset_by_y
                new_brick = generate_brick(x, y, lvl)
                if new_brick:
                    bricks.append(new_brick)
    return bricks


def generate_enemies(bricks, lvl):
    enemies = generate_barons(bricks, lvl // 5)
    if lvl < 5:
        enemies = enemies + generate_doomguys_and_imps(bricks, lvl)
    elif lvl < 15:
        enemies = enemies + generate_doomguys_and_imps(bricks, 2 + lvl // 2)
    else:
        enemies = enemies + generate_doomguys_and_imps(bricks, 10)
    return enemies


def generate_bonuses(bricks):
    bonuses = []
    for brick in bricks:
        if not brick["has_enemy"]:
            new_bonus = generate_bonus(brick)
            if new_bonus:
                bonuses.append(new_bonus)
    return bonuses


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


def generate_doomguys_and_imps(bricks, count):
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


def generate_arachnotrons(bricks, count):
    seeds = []
    arachnotrons = []
    if count > 4:
        count = 4
    while len(seeds) < count:
        seed = random.randint(0, len(bricks) - 1)
        if seed not in seeds and not bricks[seed]["has_enemy"]:
            seeds.append(seed)
    for seed in seeds:
        enemy = {"type": "arachnotron", "x": bricks[seed]["x"], "y": bricks[seed]["y"]}
        bricks[seed]["has_enemy"] = True
        arachnotrons.append(enemy)

    return arachnotrons


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
