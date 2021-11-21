class Brick {
    maxHP;
    score;
    dropBonus = false;
    context = context;
    WIDTH = 80;
    HEIGHT = 50;

    constructor(x, y, type) {
        this.x = x;
        this.y = y;

        this.seed = Math.random();
        this.speed = [0, 0];
        this.type = type;

        this.image = new Image(this.WIDTH, this.HEIGHT);
        this.image.src = "/static/images/arkanoid/" + this.type + "_brick.png";

        this.break_sound = "/static/sound/brick_break.wav";

        this.clip_line1_1 = [Math.floor(this.x + Math.random() * this.WIDTH), this.y];
        this.clip_line1_2 = [Math.floor(this.x + Math.random() * this.WIDTH), this.y + this.HEIGHT];
        this.clip_line2_1 = [this.x, Math.floor(Math.random() * this.HEIGHT + this.y)];
        this.clip_line2_2 = [this.x + this.WIDTH, Math.floor(Math.random() * this.HEIGHT + this.y)];
        this.intersection = this.findIntersectionPoint(
            this.clip_line1_1[0], this.clip_line1_2[0], this.clip_line1_1[1], this.clip_line1_2[1],
            this.clip_line2_1[0], this.clip_line2_2[0], this.clip_line2_1[1], this.clip_line2_1[1]
        );
    }

    draw() {
        this.context.drawImage(this.image, this.x, this.y);
        this.context.strokeStyle = "black";
        this.context.lineWidth = 3;
        this.context.beginPath();
        this.context.rect(this.x, this.y, this.WIDTH, this.HEIGHT);
        this.context.stroke();
        this.context.closePath();
        this.drawCracks();
    }

    drawCracks() {
        let percent_of_hp = this.hp / this.maxHP * 100;

        if (percent_of_hp > 50) {
            this.context.lineWidth = 1;
        }
        if (percent_of_hp < 100) {
            if (this.seed > 0.5) {
                this.context.beginPath();
                this.context.moveTo(this.x, this.y);
                this.context.lineTo(this.intersection[0], this.intersection[1]);
                this.context.lineTo(this.x + this.WIDTH, this.y + this.HEIGHT);
                this.context.stroke();
            } else {
                this.context.beginPath();
                this.context.moveTo(this.x + this.WIDTH, this.y);
                this.context.lineTo(this.intersection[0], this.intersection[1]);
                this.context.lineTo(this.x, this.y + this.HEIGHT);
                this.context.stroke();
            }
        }
        if (percent_of_hp < 50) {
            if (this.seed > 0.5) {
                this.context.beginPath();
                this.context.moveTo(this.x + this.WIDTH, this.y);
                this.context.lineTo(this.intersection[0], this.intersection[1]);
                this.context.lineTo(this.x, this.y + this.HEIGHT);
                this.context.stroke();
            } else {
                this.context.beginPath();
                this.context.moveTo(this.x, this.y);
                this.context.lineTo(this.intersection[0], this.intersection[1]);
                this.context.lineTo(this.x + this.WIDTH, this.y + this.HEIGHT);
                this.context.stroke();
            }
        }
    }

    collision(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.type = "for_delete";
            play_audio(this.break_sound);
            this.create_debris();
            if (this.dropBonus) {
                this.create_bonus();
            }
        }
    }

    create_score_obj(score_list) {
        game_score += this.score;
        score_list.push(new Score_obj(this.context, this.score, this.x + this.WIDTH / 2, this.y + this.HEIGHT / 2));
    }

    create_debris() {
        debris_list.push(new Debris(this.context, this.image.src, this.x, this.y, this.intersection));
    }

    create_bonus() {
        let seed = Math.random();
            if (seed > 0.95) {
                bonuses.push(new LifeBonus(context, "life", this.x, this.y + this.HEIGHT / 2));
            } else if (seed > 0.8) {
                bonuses.push(new InvisibilityBonus(context, "invisibility", this.x, this.y + this.HEIGHT / 2));
            } else if (seed > 0.7) {
                bonuses.push(new MegaBonus(context, "mega", this.x, this.y + this.HEIGHT / 2));
            } else if (seed > 0.6) {
                bonuses.push(new SpeedBonus(context, "speed", this.x, this.y + this.HEIGHT / 2));
            } else if (seed > 0.4) {
                bonuses.push(new InvulnerabilityBonus(context, "invulnerability", this.x, this.y + this.HEIGHT / 2));
            } else if (seed > 0.2) {
                bonuses.push(new HpBonus(context, "hp", this.x, this.y + this.HEIGHT / 2));
            } else {
                bonuses.push(new Barrel(context, "barrel", this.x, this.y + this.HEIGHT / 2));
            }
    }

    findIntersectionPoint(X11, X12, Y11, Y12, X21, X22, Y21, Y22) {
        let a1 = Y11 - Y12;
        let b1 = X12 - X11;
        let a2 = Y21 - Y22;
        let b2 = X22 - X21;

        let d = a1 * b2 - a2 * b1;


        let c1 = Y12 * X11 - X12 * Y11;
        let c2 = Y22 * X21 - X22 * Y21;

        let xi = (b1 * c2 - b2 * c1) / d;
        let yi = (a2 * c1 - a1 * c2) / d;
        return [xi, yi];
    }

    move() {
        this.x += this.speed[0];
        this.y += this.speed[1];
    }
}

class DefaultBrick extends Brick {
    maxHP = 20;
    score = 10;
    constructor(x, y) {
        super(x, y, 'default')
        this.hp = this.maxHP;
    }
}

class BrownBrick extends Brick {
    maxHP = 40;
    score = 20;

    constructor(x, y) {
        super(x, y, 'brown')
        this.hp = this.maxHP;
    }
}

class BlackBrick extends Brick {
    maxHP = 100;
    score = 50;
    dropBonus = true;

    constructor(x, y) {
        super(x, y, 'black')
        this.hp = this.maxHP;
    }
}

class GreyBrick extends Brick {
    maxHP = 40;
    score = 20;
    dropBonus = true;

    constructor(x, y) {
        super(x, y, 'grey')
        this.hp = this.maxHP;
    }
}

class InvulnerableBrick extends Brick {
    constructor(x, y, boss) {
        super(x, y, 'invulnerable')
        this.WIDTH = 128;
        this.HEIGHT = 38;
        this.boss = boss;
    }

    collision() {
        let vector = [ball.x - (this.x + this.WIDTH / 2), ball.y - (this.y + this.HEIGHT / 2)];
        let length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
        ball.change_acceleration([vector[0] / length * 5, vector[1] / length * 5]);
    }

    draw() {
        this.context.drawImage(this.image, this.x, this.y);
    }

    move() {
        this.x = this.boss.x - this.boss.WIDTH / 2 + 20;
        this.y = this.boss.y + this.boss.HEIGHT - 20;
    }
}