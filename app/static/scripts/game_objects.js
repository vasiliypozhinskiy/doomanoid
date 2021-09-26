"use strict";

let config = get_config();

function get_config() {
    let config;
    $.ajax({
        async: false,
        url: "/get_config",
        type: "GET",
        success: function (data) {
            config = data["config"];
        }
    });
    return config;
}

class Paddle {
    constructor(context, x, y) {
        this.x = x;
        this.y = y;
        this.width = config.PADDLE_WIDTH;
        this.height = config.PADDLE_HEIGHT;
        this.context = context;
        this.speed = [0, 0];

        this.invisibility_duration = 0;
        this.mega_duration = 0;
        this.speed_duration = 0;
        this.mega_activated = false;
    }

    draw() {
        if (this.invisibility_duration > 0) {
            this.context.globalAlpha = 0.1;
        }
        if (this.mega_activated && this.mega_duration <= 0) {
            this.change_size(-100, -20)
            this.mega_activated = false;
        }
        this.context.beginPath();
        this.context.rect(this.x, this.y, this.width, this.height);
        this.context.fillStyle = config.PADDLE_COLOR;
        this.context.strokeStyle = "#1D4B0B";
        this.context.lineWidth = 5;
        this.context.stroke();
        this.context.fill();
        this.context.closePath();
        this.context.globalAlpha = 1;
    }

    change_size(width, height) {
        this.width += width;
        this.height += height;
        this.x -= width / 2;
        this.y -= height / 2;

        if (this.x + this.width > config.CANVAS_WIDTH - config.OFFSET_X) {
            this.x = config.CANVAS_WIDTH - config.OFFSET_X - this.width;
        }
        if (this.x < config.OFFSET_X) {
            this.x = config.OFFSET_X;
        }
        if (this.y + this.height > config.CANVAS_HEIGHT) {
            this.y = config.CANVAS_HEIGHT - config.OFFSET_Y - this.height;
        }
        if (this.y < config.CANVAS_HEIGHT - config.PADDLE_ZONE) {
            this.y = config.CANVAS_HEIGHT - config.PADDLE_ZONE;
        }
    }

    move() {
        if (this.speed_duration > 0) {
            this.speed[0] *= 2;
            this.speed[1] *= 2;
        }
        if ((this.x + this.speed[0] + this.width <= config.CANVAS_WIDTH - config.OFFSET_X)
            && (this.x + this.speed[0] >= config.OFFSET_X)) {
            this.x += this.speed[0];
        } else {
            this.speed[0] = 0;
        }
        if ((this.y + this.speed[1] + this.height <= config.CANVAS_HEIGHT - config.OFFSET_Y)
            && (this.y + this.speed[1] >= config.CANVAS_HEIGHT - config.PADDLE_ZONE)) {
            this.y += this.speed[1];
        } else {
            this.speed[1] = 0;
        }
    }

    reset() {
        this.invisibility_duration = 0;
        this.mega_duration = 0;
        this.speed_duration = 0;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - config.OFFSET_Y;
    }

    decrease_bonus_duration() {
        if (this.invisibility_duration > 0) {
            this.invisibility_duration -= 1;
        }
        if (this.speed_duration > 0) {
            this.speed_duration -= 1;
        }
        if (this.mega_duration > 0) {
            this.mega_duration -= 1;
        }
    }
}

class Ball {
    constructor(context, x, y) {
        this.context = context;
        this.x = x;
        this.y = y;
        this.radius = config.BALL_RADIUS;
        this.speed = [0, 0];
        this.acceleration = [0, 0];
        this.start_speed = config.BALL_SPEED;
        this.damage = config.BALL_DAMAGE;
        this.hp = config.BALL_HP;

        this.falling = false;
        this.onPaddle = true;
        this.fall = false;
        this.animation = false;
        this.invisibility_duration = 0;
        this.mega_activated = false;
        this.injured = false;
        this.mega_duration = 0;
        this.speed_duration = 0;
        this.invulnerability_duration = 0;

        this.frame_count = 0;
        this.image = new Image();
        this.image.src = "/static/images/arkanoid/ball.png";


        this.animation1 = new Image();
        this.animation1.src = "/static/images/arkanoid/ball_animation1.png";
        this.animation2 = new Image();
        this.animation2.src = "/static/images/arkanoid/ball_animation2.png";
        this.animation3 = new Image();
        this.animation3.src = "/static/images/arkanoid/ball_animation3.png";

        this.imageLeft = new Image();
        this.imageLeft.src = "/static/images/arkanoid/ballLeft.png";
        this.imageRight = new Image();
        this.imageRight.src = "/static/images/arkanoid/ballRight.png";
        this.imageLeftInjured = new Image();
        this.imageLeftInjured.src = "/static/images/arkanoid/ballLeftHitted.png";
        this.imageRightInjured = new Image();
        this.imageRightInjured.src = "/static/images/arkanoid/ballRightHitted.png";


        this.death1 = new Image();
        this.death1.src = "/static/images/arkanoid/ball_fall1.png";
        this.death2 = new Image();
        this.death2.src = "/static/images/arkanoid/ball_fall2.png";
        this.death2 = new Image();
        this.death2.src = "/static/images/arkanoid/ball_fall2.png";
        this.death3 = new Image();
        this.death3.src = "/static/images/arkanoid/ball_fall3.png";
        this.death4 = new Image();
        this.death4.src = "/static/images/arkanoid/ball_fall4.png";
        this.death5 = new Image();
        this.death5.src = "/static/images/arkanoid/ball_fall5.png";
        this.death6 = new Image();
        this.death6.src = "/static/images/arkanoid/ball_fall6.png";

        this.hit_sound = "/static/sound/hit.wav";
        this.fall_sound = "/static/sound/death.wav";
        this.start_sound = "/static/sound/appear.wav";
        this.attack_sound = "/static/sound/attack.wav";
        this.injured_sound = "/static/sound/injured.wav";
    }

    draw() {
        if (this.invisibility_duration > 0) {
            this.context.globalAlpha = 0.2;
        }
        if (this.mega_activated && this.mega_duration <= 0) {
            this.mega_activated = false;
            this.damage = config.BALL_DAMAGE;
            this.change_size()
        }
        if (this.fall || this.animation) {
            this.frame_count += 1;
        }

        if ((this.acceleration[0] > 0) || (this.acceleration[0] < 0))  {
            if (!this.injured) {
                this.context.drawImage(this.imageRight, this.x - this.radius, this.y - this.radius);
            } else {
                this.context.drawImage(this.imageRightInjured, this.x - this.radius, this.y - this.radius);
            }
            this.context.globalAlpha = 1;
            return;
        }

        if (this.frame_count === 0) {
            this.context.drawImage(this.image, this.x - this.radius, this.y - this.radius);
            this.context.globalAlpha = 1;
            return;
        }

        if (this.animation && this.frame_count <= 10) {
            this.context.drawImage(this.animation1, this.x - this.radius, this.y - this.radius);
            this.context.globalAlpha = 1;
            return;
        }

        if (this.animation && this.frame_count <= 20) {
            this.context.drawImage(this.animation2, this.x - this.radius, this.y - this.radius);
            this.context.globalAlpha = 1;
            return;
        }

        if (this.animation && this.frame_count <= 30) {
            this.context.drawImage(this.animation3, this.x - this.radius, this.y - this.radius);
            this.context.globalAlpha = 1;
            return;
        }

        if (this.animation && this.frame_count <= 40) {
            this.context.drawImage(this.animation2, this.x - this.radius, this.y - this.radius);
            this.context.globalAlpha = 1;
            return;
        }
        if (this.animation && this.frame_count <= 50) {
            this.context.drawImage(this.animation1, this.x - this.radius, this.y - this.radius);
            this.context.globalAlpha = 1;
            return;
        }

        if (this.fall && this.frame_count <= 60) {
            this.context.drawImage(this.death1, this.x - this.radius, config.CANVAS_HEIGHT - this.death1.height);
            this.context.globalAlpha = 1;
            return;
        }
        if (this.fall && this.frame_count <= 70) {
            this.context.drawImage(this.death2, this.x - this.radius, config.CANVAS_HEIGHT - this.death2.height);
            this.context.globalAlpha = 1;
            return;
        }
        if (this.fall && this.frame_count <= 80) {
            this.context.drawImage(this.death3, this.x - this.radius, config.CANVAS_HEIGHT - this.death3.height);
            this.context.globalAlpha = 1;
            return;
        }
        if (this.fall && this.frame_count <= 90) {
            this.context.drawImage(this.death4, this.x - this.radius, config.CANVAS_HEIGHT - this.death4.height);
            this.context.globalAlpha = 1;
            return;
        }
        if (this.fall && this.frame_count <= 100) {
            this.context.drawImage(this.death5, this.x - this.radius, config.CANVAS_HEIGHT - this.death5.height);
            this.context.globalAlpha = 1;
            return;
        }
        if (this.fall && this.frame_count <= 110) {
            this.context.drawImage(this.death6, this.x - this.radius, config.CANVAS_HEIGHT - this.death6.height);
            this.context.globalAlpha = 1;
        }
    }

    random_animation() {
        if (!this.animation) {
            let seed = Math.random();
            if (seed < 0.001) {
                this.animation = true;
                play_audio(this.attack_sound);
            }
        } else {
            if (this.frame_count === 50) {
                this.animation = false;
                this.frame_count = 0;
            }
        }
    }

    change_size() {
        if (this.mega_activated) {
            this.radius = 33;
            this.image.src = "/static/images/arkanoid/bigBall.png";

            this.animation1.src = "/static/images/arkanoid/bigBall_animation1.png";
            this.animation2.src = "/static/images/arkanoid/bigBall_animation2.png";
            this.animation3.src = "/static/images/arkanoid/bigBall_animation3.png";

            this.imageLeft.src = "/static/images/arkanoid/bigBallLeft.png";
            this.imageRight.src = "/static/images/arkanoid/bigBallRight.png";
            this.imageLeftInjured.src = "/static/images/arkanoid/bigBallLeftHitted.png";
            this.imageRightInjured.src = "/static/images/arkanoid/bigBallRightHitted.png";

            this.death1.src = "/static/images/arkanoid/bigBall_fall1.png";
            this.death2.src = "/static/images/arkanoid/bigBall_fall2.png";
            this.death2.src = "/static/images/arkanoid/bigBall_fall2.png";
            this.death3.src = "/static/images/arkanoid/bigBall_fall3.png";
            this.death4.src = "/static/images/arkanoid/bigBall_fall4.png";
            this.death5.src = "/static/images/arkanoid/bigBall_fall5.png";
            this.death6.src = "/static/images/arkanoid/bigBall_fall6.png";
        } else {
            this.radius = config.BALL_RADIUS;
            this.image.src = "/static/images/arkanoid/ball.png";

            this.animation1.src = "/static/images/arkanoid/ball_animation1.png";
            this.animation2.src = "/static/images/arkanoid/ball_animation2.png";
            this.animation3.src = "/static/images/arkanoid/ball_animation3.png";

            this.imageLeft.src = "/static/images/arkanoid/ballLeft.png";
            this.imageRight.src = "/static/images/arkanoid/ballRight.png";
            this.imageLeftInjured.src = "/static/images/arkanoid/ballLeftHitted.png";
            this.imageRightInjured.src = "/static/images/arkanoid/ballRightHitted.png";

            this.death1.src = "/static/images/arkanoid/ball_fall1.png";
            this.death2.src = "/static/images/arkanoid/ball_fall2.png";
            this.death2.src = "/static/images/arkanoid/ball_fall2.png";
            this.death3.src = "/static/images/arkanoid/ball_fall3.png";
            this.death4.src = "/static/images/arkanoid/ball_fall4.png";
            this.death5.src = "/static/images/arkanoid/ball_fall5.png";
            this.death6.src = "/static/images/arkanoid/ball_fall6.png";
        }
    }

    wallCollision() {
        if (this.x + this.radius > config.CANVAS_WIDTH) {
            this.speed[0] = -Math.abs(this.speed[0]);
            this.x = config.CANVAS_WIDTH - this.radius;
            this.acceleration[0] = -this.acceleration[0];
            play_audio(this.hit_sound);
        }

        if (this.x - this.radius < 0) {
            this.speed[0] = Math.abs(this.speed[0]);
            this.x = this.radius;
            this.acceleration[0] = -this.acceleration[0];
            play_audio(this.hit_sound);
        }

        if (this.y - this.radius < 0) {
            this.speed[1] = Math.abs(this.speed[1]);
            this.y = this.radius;
            this.acceleration[1] = -this.acceleration[1];
            play_audio(this.hit_sound);
        }
        if ((this.y + this.radius >= config.CANVAS_HEIGHT)
            || (this.x + this.radius < 0)
            || (this.x - this.radius > config.CANVAS_WIDTH)
            || (this.y + this.radius < 0)) {
            if (!this.fall) {
                this.speed = [0, 0];
                this.acceleration[0] = 0;
                this.fall = true;
                this.frame_count = 50;
                play_audio(this.fall_sound);
                lives -= 1;
            }
            if (this.frame_count > 100) {
                this.reset();
            }
        }
    }

    paddleCollision() {
        if ((!this.fall) && (this.y + this.radius > paddle.y) && (this.y - this.radius < paddle.y + paddle.height)
            && (this.x + this.radius > paddle.x) && (this.x - this.radius < paddle.x + paddle.width)) {
            play_audio(this.hit_sound);
            //hit top
            if ((this.x + this.radius > paddle.x) && (this.x - this.radius < paddle.x + paddle.width) && (this.y < paddle.y)) {
                let collidePoint = this.x - (paddle.x + paddle.width / 2);
                collidePoint = collidePoint / (paddle.width / 2);
                let angle = collidePoint * (Math.PI / 6);

                this.speed[0] = this.start_speed * Math.sin(angle);
                this.speed[1] = -this.start_speed * Math.cos(angle);
                this.acceleration[0] += paddle.speed[0];
                this.acceleration[1] = -this.acceleration[1];
                if (paddle.speed[1] < 0) {
                    this.acceleration[1] += paddle.speed[1] * 2;
                }
                this.y = paddle.y - this.radius;
                return;
            }

            //hit left
            if (this.x < paddle.x) {
                this.speed[0] = -Math.abs(this.speed[0]);
                this.acceleration[0] = -this.acceleration[0];
                this.x = paddle.x - this.radius;
                return;
            }
            //hit right
            if (this.x > paddle.x + paddle.width) {
                this.speed[0] = Math.abs(this.speed[0]);
                this.acceleration[0] = -this.acceleration[0];
                this.x = paddle.x + paddle.width + this.radius;
                return;
            }
            //hit bottom
            if ((this.x + this.radius > paddle.x) && (this.x - this.radius < paddle.x + paddle.width) && (this.y > paddle.y)) {
                this.speed[1] = -this.speed[1];
                this.acceleration[1] = -this.acceleration[1];
                this.y = paddle.y + paddle.height + this.radius;
            }
        }
    }

    brickCollision(brick) {
        if ((this.y + this.radius > brick.y) && (this.y - this.radius < brick.y + brick.height)
            && (this.x + this.radius > brick.x) && (this.x - this.radius < brick.x + brick.width)) {
            brick.collision(this.damage);
            play_audio(this.hit_sound);

            if ((this.x + this.radius - this.speed[0] <= brick.x) || (this.x - this.radius - this.speed[0] >= brick.x + brick.width)) {

                if (this.x < brick.x + brick.width / 2) {
                    this.speed[0] = -Math.abs(this.speed[0]);
                    this.acceleration[0] = -this.acceleration[0];
                } else {
                    this.speed[0] = Math.abs(this.speed[0]);
                    this.acceleration[0] = -this.acceleration[0];
                }
                this.x += this.speed[0] - brick.speed[0];
                this.y -= this.speed[1] + brick.speed[1];
            } else {
                if (this.y < brick.y + brick.height / 2) {
                    this.speed[1] = -Math.abs(this.speed[1]);
                    this.acceleration[1] = -this.acceleration[1];
                } else {
                    this.speed[1] = Math.abs(this.speed[1]);
                    this.acceleration[1] = -this.acceleration[1];
                }
                this.x -= this.speed[0] + brick.speed[0];
                this.y += this.speed[1] - brick.speed[1];
            }
        }

    }

    move() {
        if ((this.falling || Math.abs(this.speed[1]) < 2) && !this.onPaddle) {
            this.x += this.speed[0] + this.acceleration[0];
            this.speed[1] += config.FALLING_SPEED * 5;
            this.y += this.speed[1] + this.acceleration[1];
            return;
        }
        if (this.onPaddle) {
            this.x = paddle.x + paddle.width / 2;
            this.y = paddle.y - this.radius;
        } else {
            this.x += this.speed[0] + this.acceleration[0];
            this.y += this.speed[1] + this.acceleration[1];
            if (this.speed_duration > 0) {
                this.x += this.speed[0];
                this.y += this.speed[1];
            }

        }
    }

    change_acceleration(acceleration) {
        if (this.mega_duration === 0) {
            this.acceleration[0] += acceleration[0];
            this.acceleration[1] += acceleration[1];
        } else {
            this.acceleration[0] += acceleration[0] / 2;
            this.acceleration[1] += acceleration[1] / 2;
        }
    }

    friction() {
        let shift = config.FRICTION
        if (this.acceleration[0] > shift) {
            this.acceleration[0] -= shift;
        }
        if (this.acceleration[0] < -shift) {
            this.acceleration[0] += shift;
        }
        if (this.acceleration[0] < shift && this.acceleration[0] > -shift) {
            this.acceleration[0] = 0;
            this.injured = false;
        }
        if (this.acceleration[1] > shift) {
            this.acceleration[1] -= shift;
        }
        if (this.acceleration[1] < -shift) {
            this.acceleration[1] += shift;
        }
        if (this.acceleration[1] < shift && this.acceleration[1] > -shift) {
            this.acceleration[1] = 0;
        }
    }

    change_hp(hp) {
        if (hp > 0) {
            this.hp += hp;
        } else if (this.invulnerability_duration === 0 && this.hp > 0) {
            this.hp += hp;
            play_audio(this.injured_sound);
        }
        if (this.hp <= 0) {
            this.falling = true;
        }
    }

    decrease_bonus_duration() {
        if (this.mega_duration > 0) {
            this.mega_duration -= 1;
        }
        if (this.speed_duration > 0) {
            this.speed_duration -= 1;
        }
        if (this.invulnerability_duration > 0) {
            this.invulnerability_duration -= 1;
        }
        if (this.invisibility_duration > 0) {
            this.invisibility_duration -= 1;
        }
    }

    start() {
        if (this.onPaddle) {
            play_audio(this.start_sound);

            let seed = Math.floor(30 + Math.random() * 120);
            let angle = seed * Math.PI / 180;

            this.speed[0] = this.start_speed * Math.cos(angle);
            this.speed[1] = -this.start_speed * Math.sin(angle);
            this.acceleration = [0, 0];
            this.onPaddle = false;
        }
    }

    reset() {
        if (this.fall) {
            this.hp = config.BALL_HP;
        }
        if (this.hp === 0) {
            this.hp = 1;
        }
        this.onPaddle = true;
        this.fall = false;
        this.falling = false;
        this.x = paddle.x + paddle.width / 2;
        this.y = paddle.y - this.radius;
        this.frame_count = 0;
        this.invisibility_duration = 0;
        this.mega_duration = 0;
        this.speed_duration = 0;
        this.invulnerability_duration = 0;
    }

}

class Brick {
    constructor(context, type, x, y) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 50;
        this.context = context;
        this.hp = 10;
        this.score = 10;
        this.seed = Math.random();
        this.speed = [0, 0];
        this.type = type;

        this.image = new Image(this.width, this.height);
        this.image.src = "/static/images/arkanoid/" + type + "_brick.png";

        this.break_sound = "/static/sound/brick_break.wav";

        this.clip_line1_1 = [Math.floor(this.x + Math.random() * this.width), this.y];
        this.clip_line1_2 = [Math.floor(this.x + Math.random() * this.width), this.y + this.height];
        this.clip_line2_1 = [this.x, Math.floor(Math.random() * this.height + this.y)];
        this.clip_line2_2 = [this.x + this.width, Math.floor(Math.random() * this.height + this.y)];
        this.intersection = this.findIntersectionPoint(this.clip_line1_1[0], this.clip_line1_2[0], this.clip_line1_1[1], this.clip_line1_2[1],
            this.clip_line2_1[0], this.clip_line2_2[0], this.clip_line2_1[1], this.clip_line2_1[1]);
    }

    draw() {
        this.context.drawImage(this.image, this.x, this.y);
        this.context.strokeStyle = "black";
        this.context.lineWidth = 3;
        this.context.beginPath();
        this.context.rect(this.x, this.y, this.width, this.height);
        this.context.stroke();
        this.context.closePath();
        if (this.hp > 20) {
            this.context.lineWidth = 1;
        }
        if (this.hp < 40) {
            if (this.seed > 0.5) {
                this.context.beginPath();
                this.context.moveTo(this.x, this.y);
                this.context.lineTo(this.intersection[0], this.intersection[1]);
                this.context.lineTo(this.x + this.width, this.y + this.height);
                this.context.stroke();
            } else {
                this.context.beginPath();
                this.context.moveTo(this.x + this.width, this.y);
                this.context.lineTo(this.intersection[0], this.intersection[1]);
                this.context.lineTo(this.x, this.y + this.height);
                this.context.stroke();
            }
        }
        if (this.hp < 20) {
            if (this.seed > 0.5) {
                this.context.beginPath();
                this.context.moveTo(this.x + this.width, this.y);
                this.context.lineTo(this.intersection[0], this.intersection[1]);
                this.context.lineTo(this.x, this.y + this.height);
                this.context.stroke();
            } else {
                this.context.beginPath();
                this.context.moveTo(this.x, this.y);
                this.context.lineTo(this.intersection[0], this.intersection[1]);
                this.context.lineTo(this.x + this.width, this.y + this.height);
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
        }
    }

    create_score_obj(score_list) {
        game_score += this.score;
        score_list.push(new Score_obj(this.context, this.score, this.x + this.width / 2, this.y + this.height / 2));
    }

    create_debris() {
        debris_list.push(new Debris(this.context, this.image.src, this.x, this.y, this.intersection));
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
    constructor(context, type, x, y) {
        super(context, type, x, y)
        this.hp = 20;
        this.score = 10;
    }

    draw() {
        this.context.drawImage(this.image, this.x, this.y);
        this.context.strokeStyle = "black";
        this.context.lineWidth = 3;
        if (this.hp < 20 && this.seed > 0.5) {
            this.context.beginPath();
            this.context.moveTo(this.x, this.y);
            this.context.lineTo(this.intersection[0], this.intersection[1]);
            this.context.lineTo(this.x + this.width, this.y + this.height);
            this.context.stroke();
        }
        if (this.hp < 20 && this.seed <= 0.5) {
            this.context.beginPath();
            this.context.moveTo(this.x + this.width, this.y);
            this.context.lineTo(this.intersection[0], this.intersection[1]);
            this.context.lineTo(this.x, this.y + this.height);
            this.context.stroke();
        }
        this.context.beginPath();
        this.context.rect(this.x, this.y, this.width, this.height);
        this.context.closePath();
        this.context.stroke();
    }
}

class BrownBrick extends Brick {
    constructor(context, type, x, y) {
        super(context, type, x, y)
        this.hp = 40;
        this.score = 20;
    }
}

class GreyBrick extends Brick {
    constructor(context, type, x, y) {
        super(context, type, x, y)
        this.hp = 40;
        this.score = 20;
    }

    collision(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.type = "for_delete";
            play_audio(this.break_sound);
            this.create_debris();
            let seed = Math.random();
            if (seed > 0.95) {
                bonuses.push(new LifeBonus(context, "life", this.x, this.y + this.height / 2));
            } else if (seed > 0.8) {
                bonuses.push(new InvisibilityBonus(context, "invisibility", this.x, this.y + this.height / 2));
            } else if (seed > 0.7) {
                bonuses.push(new MegaBonus(context, "mega", this.x, this.y + this.height / 2));
            } else if (seed > 0.6) {
                bonuses.push(new SpeedBonus(context, "speed", this.x, this.y + this.height / 2));
            } else if (seed > 0.4) {
                bonuses.push(new InvulnerabilityBonus(context, "invulnerability", this.x, this.y + this.height / 2));
            } else if (seed > 0.2) {
                bonuses.push(new HpBonus(context, "hp", this.x, this.y + this.height / 2));
            } else {
                bonuses.push(new Barrel(context, "barrel", this.x, this.y + this.height / 2));
            }
        }
    }
}

class InvulnerableBrick extends Brick {
    constructor(context, type, x, y) {
        super(context, type, x, y)
        this.width = 128;
        this.height = 38;
    }

    collision() {
        let vector = [ball.x - (this.x + this.width / 2), ball.y - (this.y + this.height / 2)];
        let length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
        ball.change_acceleration([vector[0] / length * 5, vector[1] / length * 5]);
    }

    draw() {
        this.context.drawImage(this.image, this.x, this.y);
    }

    move() {
        let oldX = this.x;
        let oldY = this.y;
        this.x = cyberdemon.x - cyberdemon.width / 2 + 20;
        this.y = cyberdemon.y + cyberdemon.height - 20;
        this.speed = [this.x - oldX, this.y - oldY];
    }
}

class Bonus {
    constructor(context, type, x, y) {
        this.context = context;
        this.type = type;
        this.x = x + 40;
        this.radius = config.BONUS_RADIUS;
        this.y = y - this.radius;
        this.speed = [0, 0];
        this.onBrick = true;
        this.score = 0;
        this.duration = 0;
        this.frame_count = Math.floor(Math.random() * (41));

        this.was_ball_collision = false;

        this.animation1 = new Image();
        this.animation1.src = "/static/images/arkanoid/" + type + "_bonus1.png";
        this.animation2 = new Image();
        this.animation2.src = "/static/images/arkanoid/" + type + "_bonus2.png";
        this.animation3 = new Image();
        this.animation3.src = "/static/images/arkanoid/" + type + "_bonus3.png";
        this.animation4 = new Image();
        this.animation4.src = "/static/images/arkanoid/" + type + "_bonus4.png";

        this.ball_item_up_sound = "/static/sound/getpow.wav";
        this.paddle_item_up_sound = "/static/sound/itemup.wav";
    }

    draw() {
        if (this.frame_count < 40) {
            this.frame_count++;
        } else {
            this.frame_count = 0;
        }
        if (this.frame_count <= 10) {
            this.context.drawImage(this.animation1, this.x - this.radius, this.y - this.radius);
            return;
        }

        if (this.frame_count <= 20) {
            this.context.drawImage(this.animation2, this.x - this.radius, this.y - this.radius);
            return;
        }

        if (this.frame_count <= 30) {
            this.context.drawImage(this.animation3, this.x - this.radius, this.y - this.radius);
            return;
        }

        if (this.frame_count <= 40) {
            this.context.drawImage(this.animation2, this.x - this.radius, this.y - this.radius);
        }
    }

    move() {
        if (!this.onBrick) {
            this.y += this.speed[1];
            this.speed[1] += config.FALLING_SPEED;
        } else {
            this.x += this.speed[0];
            this.y += this.speed[1];
        }

        if (this.y + this.radius > config.CANVAS_HEIGHT) {
            this.type = "for_delete";
        }
    }

    paddleCollision() {
        if ((this.y + this.radius > paddle.y) && (this.y - this.radius < paddle.y + paddle.height)
            && (this.x + this.radius > paddle.x) && (this.x - this.radius < paddle.x + paddle.width)) {
            play_audio(this.paddle_item_up_sound);
            switch (this.type) {
                case "life":
                    lives += 1;
                    break;
                case "hp":
                    if (!ball.falling) {
                        ball.change_hp(1);
                    }
                    break;
                case "invisibility":
                    paddle.invisibility_duration += this.duration;
                    break;
                case "invulnerability":
                    paddle.invulnerability_duration += this.duration;
                    break;
                case "speed":
                    paddle.speed_duration += this.duration;
                    break;
                case "mega":
                    paddle.mega_duration += this.duration;
                    if (!paddle.mega_activated) {
                        paddle.mega_activated = true;
                        paddle.change_size(100, 20);
                    }
                    paddle.mega_activated = true;
                    break;
            }
            this.create_score_obj();
            this.type = "for_delete";
        }
    }

    ballCollision() {
        let distX = this.x - ball.x;
        let distY = this.y - ball.y;
        let distance = Math.sqrt(distX * distX + distY * distY);
        if (distance <= this.radius + ball.radius) {
            this.was_ball_collision = true;
            play_audio(this.ball_item_up_sound);
            switch (this.type) {
                case "life":
                    lives += 1;
                    ball.falling = false;
                    if (ball.hp < config.BALL_HP) {
                        ball.change_hp(config.BALL_HP - ball.hp);
                    }
                    break;
                case "hp":
                    ball.change_hp(2);
                    ball.falling = false;
                    break;
                case "invisibility":
                    ball.invisibility_duration += this.duration;
                    break;
                case "invulnerability":
                    ball.invulnerability_duration += this.duration;
                    this.score = 0;
                    break;
                case "speed":
                    ball.speed_duration += this.duration;
                    break;
                case "mega":
                    ball.mega_duration += this.duration;
                    if (!ball.mega_activated) {
                        ball.mega_activated = true;
                        ball.damage = 20;
                        ball.change_size();
                    }
                    break;
            }
            this.create_score_obj();
            this.type = "for_delete";
        }
    }

    brickCollision(bricks) {
        this.onBrick = false;
        for (let i = 0; i < bricks.length; i++) {
            let brick = bricks[i];
            if ((this.y + this.radius > brick.y) && (this.y - this.radius < brick.y + brick.height)
                && (this.x + this.radius - 3 > brick.x) && (this.x - this.radius < brick.x + brick.width - 3) && (this.y < brick.y)) {
                this.onBrick = true;
                this.speed = brick.speed;
            }
        }
    }

    create_score_obj() {
        if (this.score > 0) {
            if (this.was_ball_collision) {
                game_score += this.score * 2;
                score_list.push(new Score_obj(this.context, this.score * 2, this.x, this.y));
            } else {
                game_score += this.score;
                score_list.push(new Score_obj(this.context, this.score, this.x, this.y));
            }
        }
    }
}


class LifeBonus extends Bonus {
    constructor(context, type, x, y) {
        super(context, type, x, y)
    }
}

class InvisibilityBonus extends Bonus {
    constructor(context, type, x, y) {
        super(context, type, x, y)

        this.duration = 500;
        this.score = 50;
    }
}

class MegaBonus extends Bonus {
    constructor(context, type, x, y) {
        super(context, type, x, y)

        this.duration = 500;
        this.score = 25;
    }
}

class SpeedBonus extends Bonus {
    constructor(context, type, x, y) {
        super(context, type, x, y)

        this.duration = 200;
        this.score = 50;
    }
}

class InvulnerabilityBonus extends Bonus {
    constructor(context, type, x, y) {
        super(context, type, x, y)

        this.duration = 1000;
        this.score = 100;
    }
}

class HpBonus extends Bonus {
    constructor(context, type, x, y) {
        super(context, type, x, y)
        this.radius = 18;
    }
}

class Barrel {
    constructor(context, type, x, y) {
        this.context = context;
        this.width = 23;
        this.height = 33;
        this.x = x + config.BRICK_WIDTH / 2 - this.width / 2;
        this.y = y - this.height;
        this.frame_count = 0;
        this.onBrick = true;
        this.onPaddle = false;
        this.explode = false;
        this.type = type;
        this.speed = [0, 0];
        this.score = 50;

        this.image = new Image();
        this.image.src = "/static/images/arkanoid/barrel.png";
        this.animation1 = new Image();
        this.animation1.src = "/static/images/arkanoid/barrel_explosion1.png";
        this.animation2 = new Image();
        this.animation2.src = "/static/images/arkanoid/barrel_explosion2.png";
        this.animation3 = new Image();
        this.animation3.src = "/static/images/arkanoid/barrel_explosion3.png";

        this.explode_sound = "/static/sound/barrel_explosion.wav";
    }

    draw() {
        if (this.explode && this.frame_count <= 15) {
            this.frame_count++;
        }

        if (this.explode && this.frame_count > 15) {
            this.type = "for_delete";
        }

        if (this.frame_count === 0) {
            context.drawImage(this.image, this.x, this.y);
            return;
        }

        if (this.frame_count <= 5) {
            let width_diff = (this.width - this.animation1.width) / 2;
            let height_diff = this.height - this.animation1.height;
            context.drawImage(this.animation1, this.x + width_diff, this.y + height_diff);
            return;
        }
        if (this.frame_count <= 10) {
            let width_diff = (this.width - this.animation2.width) / 2;
            let height_diff = this.height - this.animation2.height;
            context.drawImage(this.animation2, this.x + width_diff, this.y + height_diff);
            return;
        }
        if (this.frame_count <= 15) {
            let width_diff = (this.width - this.animation3.width) / 2;
            let height_diff = this.height - this.animation3.height;
            context.drawImage(this.animation3, this.x + width_diff, this.y + height_diff);
        }
    }

    move() {
        if (!this.onBrick && !this.onPaddle) {
            this.y += this.speed[1];
            this.speed[1] += config.FALLING_SPEED;
        }
        if (this.onBrick) {
            this.x += this.speed[0];
            this.y += this.speed[1];
        }

        if (this.y + this.height > config.CANVAS_HEIGHT) {
            if (!this.explode) {
                this.create_score_obj();
                play_audio(this.explode_sound);
            }
            this.speed = [0, 0];
            this.explode = true;
        }

        if (this.onPaddle) {
            this.y = paddle.y - this.height;
            this.x += paddle.speed[0];
        }
    }

    brickCollision(bricks) {
        this.onBrick = false;
        for (let i = 0; i < bricks.length; i++) {
            let brick = bricks[i];
            if ((this.y + this.height > brick.y) && (this.y < brick.y + brick.height)
                && (this.x + this.width - 3 > brick.x) && (this.x < brick.x + brick.width - 3) && (this.y < brick.y)) {
                this.onBrick = true;
                this.speed = brick.speed;
            }
        }
    }

    ballCollision() {
        if ((!ball.fall) && (ball.y + ball.radius > this.y) && (ball.y - ball.radius < this.y + this.height)
            && (ball.x + ball.radius > this.x) && (ball.x - ball.radius < this.x + this.width) && !this.explode) {
            play_audio(this.explode_sound);
            this.explode = true;

            let vector = [ball.x - (this.x + this.width / 2), ball.y - (this.y + this.height / 2)];
            let length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
            ball.speed = [(vector[0] / length * ball.start_speed), (vector[1] / length * ball.start_speed)];
            ball.change_acceleration([vector[0] / length * 10, vector[1] / length * 10]);
            ball.change_hp(-1);
        }
    }

    paddleCollision() {
        if ((this.y + this.height > paddle.y) && (this.y < paddle.y + paddle.height)
            && (this.x + this.width > paddle.x) && (this.x < paddle.x + paddle.width)) {
            this.onPaddle = true;
            this.speed[1] = 0;
        }
        if ((this.x + this.width < paddle.x) || (this.x > paddle.x + paddle.width)) {
            this.onPaddle = false;
        }
    }

    create_score_obj() {
        game_score += this.score;
        score_list.push(new Score_obj(this.context, this.score, this.x, this.y));
    }
}

class Enemy {
    height;
    width;
    score;

    constructor(context, type, x, y) {
        this.context = context;
        this.x = x;
        this.y = y;
        this.frame_count = Math.floor(Math.random() * (120));
        this.onBrick = true;
        this.dead = false;
        this.shooting = false;
        this.speed = [0, 0];
        this.type = type;

        this.animation1 = new Image();
        this.animation1.src = "/static/images/arkanoid/" + type + "1.png";
        this.animation2 = new Image();
        this.animation2.src = "/static/images/arkanoid/" + type + "2.png";
        this.animation3 = new Image();
        this.animation3.src = "/static/images/arkanoid/" + type + "3.png";
        this.animation4 = new Image();
        this.animation4.src = "/static/images/arkanoid/" + type + "4.png";

        this.fire_left_1 = new Image();
        this.fire_left_1.src = "/static/images/arkanoid/" + type + "_fire_left1.png";
        this.fire_left_2 = new Image();
        this.fire_left_2.src = "/static/images/arkanoid/" + type + "_fire_left2.png";
        this.fire_left_3 = new Image();
        this.fire_left_3.src = "/static/images/arkanoid/" + type + "_fire_left3.png";
        this.fire_right_1 = new Image();
        this.fire_right_1.src = "/static/images/arkanoid/" + type + "_fire_right1.png";
        this.fire_right_2 = new Image();
        this.fire_right_2.src = "/static/images/arkanoid/" + type + "_fire_right2.png";
        this.fire_right_3 = new Image();
        this.fire_right_3.src = "/static/images/arkanoid/" + type + "_fire_right3.png";

        this.death1 = new Image();
        this.death1.src = "/static/images/arkanoid/" + type + "_death1.png";
        this.death2 = new Image();
        this.death2.src = "/static/images/arkanoid/" + type + "_death2.png";
        this.death3 = new Image();
        this.death3.src = "/static/images/arkanoid/" + type + "_death3.png";
        this.death4 = new Image();
        this.death4.src = "/static/images/arkanoid/" + type + "_death4.png";
        this.death5 = new Image();
        this.death5.src = "/static/images/arkanoid/" + type + "_death5.png";
        this.death6 = new Image();
        this.death6.src = "/static/images/arkanoid/" + type + "_death6.png";

        this.fire_sound = "/static/sound/" + type + "_fire.wav";
        this.death_sound_1 = "/static/sound/" + type + "_death1.wav";
        this.death_sound_2 = "/static/sound/" + type + "_death2.wav";
    }

    draw() {
        if (!this.shooting && !this.dead && this.frame_count > 120) {
            this.frame_count = 0;
        }

        if (this.shooting && this.frame_count > 120) {
            this.shooting = false;
            this.frame_count = 0;
        }

        if (this.injured && this.frame_count > 30) {
            this.injured = false;
            this.frame_count = 0;
        }

        if (!this.dead && this.shooting && this.frame_count <= 10) {
            if (this.x < ball.x) {
                this.context.drawImage(this.fire_right_1, this.x, this.y);
                this.frame_count++;
                return;
            }
            if (this.x > ball.x) {
                this.context.drawImage(this.fire_left_1, this.x, this.y);
                this.frame_count++;
                return;
            }
        }
        if (!this.dead && this.shooting && this.frame_count <= 40) {
            if (this.x < ball.x) {
                this.context.drawImage(this.fire_right_2, this.x, this.y);
                this.frame_count++;
                return;
            }
            if (this.x > ball.x) {
                this.context.drawImage(this.fire_left_2, this.x, this.y);
                this.frame_count++;
                return;
            }
        }
        if (!this.dead && this.shooting && this.frame_count <= 120) {
            if (this.x < ball.x) {
                this.context.drawImage(this.fire_right_3, this.x, this.y);
                this.frame_count++;
                return;
            }
            if (this.x > ball.x) {
                this.context.drawImage(this.fire_left_3, this.x, this.y);
                this.frame_count++;
                return;
            }
        }

        if (this.injured && this.frame_count <= 30) {
            this.context.drawImage(this.injure, this.x, this.y);
            this.frame_count++;
            return;
        }

        if (!this.dead && this.frame_count <= 30) {
            this.context.drawImage(this.animation1, this.x, this.y);
            this.frame_count++;
            return;
        }
        if (!this.dead && this.frame_count <= 60) {
            this.context.drawImage(this.animation2, this.x, this.y);
            this.frame_count++;
            return;
        }
        if (!this.dead && this.frame_count <= 90) {
            this.context.drawImage(this.animation3, this.x, this.y);
            this.frame_count++;
            return;
        }
        if (!this.dead && this.frame_count <= 120) {
            this.context.drawImage(this.animation2, this.x, this.y);
            this.frame_count++;
            return;
        }

        if (this.dead && this.frame_count <= 10) {
            let height_diff = this.height - this.death1.height;
            this.context.drawImage(this.death1, this.x, this.y + height_diff);
            this.frame_count++;
            return;
        }
        if (this.dead && this.frame_count <= 20) {
            let height_diff = this.height - this.death2.height;
            this.context.drawImage(this.death2, this.x, this.y + height_diff);
            this.frame_count++;
            return;
        }
        if (this.dead && this.frame_count <= 30) {
            let height_diff = this.height - this.death3.height;
            this.context.drawImage(this.death3, this.x, this.y + height_diff);
            this.frame_count++;
            return;
        }
        if (this.dead && this.frame_count <= 40) {
            let height_diff = this.height - this.death4.height;
            this.context.drawImage(this.death4, this.x, this.y + height_diff);
            this.frame_count++;
            return;
        }
        if (this.dead && this.frame_count <= 50) {
            let height_diff = this.height - this.death5.height;
            this.context.drawImage(this.death5, this.x, this.y + height_diff);
            this.frame_count++;
            return;
        }
        if (this.dead && this.frame_count <= 60) {
            let height_diff = this.height - this.death6.height;
            this.context.drawImage(this.death6, this.x, this.y + height_diff);
        }
    }

    move() {
        if (!this.onBrick) {
            this.y += this.speed[1];
            this.speed[1] += config.FALLING_SPEED;
        }

        if (this.x > 0 && this.x + this.width < config.CANVAS_WIDTH) {
            this.x += this.speed[0];
        }

        if (this.y + this.height > config.CANVAS_HEIGHT) {
            this.speed = [0, 0];
            if (!this.dead) {
                this.frame_count = 0;
                this.dead = true;
                play_audio(this.death_sound_2);
                game_score += this.score;
                score_list.push(new Score_obj(this.context, this.score, this.x + this.width / 2, this.y + this.height / 2));
            }
        }
    }

    friction() {
        let shift = config.FRICTION
        if (this.speed[0] > shift) {
            this.speed[0] -= shift;
        }
        if (this.speed[0] < -shift) {
            this.speed[0] += shift;
        }
        if (this.speed[0] < shift && this.speed[0] > -shift) {
            this.speed[0] = 0;
        }
    }

    brickCollision(bricks) {
        this.onBrick = false;
        for (let i = 0; i < bricks.length; i++) {
            let brick = bricks[i];
            if ((this.y + this.height > brick.y) && (this.y < brick.y + brick.height)
                && (this.x + this.width / 2 > brick.x) && (this.x + this.width / 2 < brick.x + brick.width)
                && (this.y + this.height - 5 <= brick.y)) {
                this.onBrick = true;
                this.speed[1] = 0;
            }
        }
    }

    ballCollision() {
        if ((!this.dead) && (!ball.fall) && (ball.y + ball.radius > this.y) && (ball.y - ball.radius < this.y + this.height)
            && (ball.x + ball.radius > this.x) && (ball.x - ball.radius < this.x + this.width)) {
            this.frame_count = 0;
            this.hp -= ball.damage;
            if (this.hp <= 0 || !this.onBrick) {
                this.dead = true;
                play_audio(this.death_sound_1);
                if (this.x < ball.x) {
                    this.speed[0] = -3 - Math.random();
                } else {
                    this.speed[0] = 3 + Math.random();
                }
                game_score += this.score * 2;
                score_list.push(new Score_obj(this.context, this.score * 2, this.x + this.width / 2, this.y + this.height / 2));
            } else {
                this.shooting_delay += 50;
                this.injured = true;
                play_audio(this.injured_sound);

                let vector = [ball.x - (this.x + this.width / 2), ball.y - (this.y + this.height / 2)];
                let length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
                ball.speed = [(vector[0] / length * ball.start_speed), (vector[1] / length * ball.start_speed)];
                ball.change_acceleration([vector[0] / length * 5, vector[1] / length * 5]);
            }
            this.shooting = false;
            play_audio(ball.attack_sound);
            ball.animation = true;
        }
    }
}

class Doomguy extends Enemy {
    constructor(context, type, x, y) {
        super(context, type, x, y)
        this.x = x + 30;
        this.height = 40;
        this.width = 30;
        this.y = y - this.height;
        this.hp = 10;
        this.score = 100;
        this.type = type;

        this.fire_left_3 = this.fire_left_1;
        this.fire_right_3 = this.fire_right_1;

    }

    checkForShooting() {
        if (this.onBrick && !this.dead) {
            let distX = this.x - ball.x;
            let distY = this.y - ball.y;
            let distance = Math.sqrt(distX * distX + distY * distY);
            if ((distance <= ball.radius + 100) &&
                (this.y < ball.y + ball.radius - 10) && (this.y + this.height > ball.y - ball.radius + 10)) {
                if (!this.shooting && ball.invisibility_duration === 0) {
                    this.shooting = true;
                    ball.injured = true;
                    play_audio(this.fire_sound);
                    this.frame_count = 0;
                    ball.change_hp(-1);
                    if (this.x < ball.x) {
                        ball.change_acceleration([7 + Math.random() * 5, 0]);
                    } else {
                        ball.change_acceleration([-7 - Math.random() * 5, 0]);
                    }
                }
            }
        }
    }
}

class Imp extends Enemy {
    constructor(context, type, x, y) {
        super(context, type, x, y)
        this.x = x + 30;
        this.height = 40;
        this.width = 30;
        this.y = y - this.height;
        this.hp = 10;
        this.score = 100;
        this.shooting_delay = 400 + Math.floor(Math.random() * 400);
        this.type = type;
    }

    checkForShooting() {
        if (!this.dead && this.onBrick) {
            if (this.shooting_delay === 40) {
                this.frame_count = 0;
            }

            if (this.shooting_delay < 40) {
                this.shooting = true;
            }

            if (this.shooting && this.shooting_delay === 0) {
                play_audio(this.fire_sound);
                if (this.x + this.width / 2 < ball.x) {
                    rockets.push(new Red_fire(this.context, "red_fire", this.x + this.width, this.y + this.height / 2 - 5));
                } else {
                    rockets.push(new Red_fire(this.context, "red_fire", this.x, this.y + this.height / 2 - 5));
                }
                this.shooting_delay = 400 + Math.floor(Math.random() * 400)
            }

            if (this.shooting_delay > 0) {
                this.shooting_delay--;
            }
        }
    }
}

class Baron extends Enemy {
    constructor(context, type, x, y) {
        super(context, type, x, y)
        this.x = x + 30;
        this.height = 50;
        this.width = 30;
        this.y = y - this.height;
        this.hp = 30;
        this.score = 200;
        this.shooting_delay = 300 + Math.floor(Math.random() * 300);
        this.type = type;

        this.injured_sound = "/static/sound/" + type + "_injured.wav";
        this.injure = new Image();
        this.injure.src = "/static/images/arkanoid/" + type + "_injured.png";
    }

    checkForShooting() {
        if (!this.dead && this.onBrick) {
            if (this.shooting_delay === 40) {
                this.frame_count = 0;
            }

            if (this.shooting_delay < 40) {
                this.shooting = true;
            }

            if (this.shooting && this.shooting_delay === 0) {
                play_audio(this.fire_sound);
                if (this.x + this.width / 2 < ball.x) {
                    rockets.push(new Green_fire(this.context, "green_fire", this.x + this.width, this.y + this.height / 2 - 5));
                } else {
                    rockets.push(new Green_fire(this.context, "green_fire", this.x, this.y + this.height / 2 - 5));
                }
                this.shooting_delay = 300 + Math.floor(Math.random() * 300)
            }

            if (this.shooting_delay > 0) {
                this.shooting_delay--;
            }
        }
    }
}

class Cyberdemon {
    constructor(lvl) {
        this.context = context;
        this.x = config.CANVAS_WIDTH / 2;
        this.height = 110;
        this.width = 88;
        this.y = config.CANVAS_HEIGHT / 2;
        this.frame_count = Math.floor(Math.random() * (120));
        this._phi = 0;
        this.lvl = lvl;

        this.dead = false;
        this.shooting = false;

        this.shooting_delay = 200 + Math.floor(Math.random() * (200 + 1));
        this.rockets_in_row = Math.floor(this.lvl / 5) + 1;
        this.rockets_fired = 0;

        this.score = 200 * this.lvl;
        this.hp = 10 * this.lvl;
        this.full_hp = this.hp;

        this.animation1 = new Image();
        this.animation1.src = "/static/images/arkanoid/cyberdemon1.png";
        this.animation2 = new Image();
        this.animation2.src = "/static/images/arkanoid/cyberdemon2.png";
        this.animation3 = new Image();
        this.animation3.src = "/static/images/arkanoid/cyberdemon3.png";
        this.animation4 = new Image();
        this.animation4.src = "/static/images/arkanoid/cyberdemon4.png";

        this.fire_left_1 = new Image();
        this.fire_left_1.src = "/static/images/arkanoid/cyberdemon_left1.png";
        this.fire_left_2 = new Image();
        this.fire_left_2.src = "/static/images/arkanoid/cyberdemon_left2.png";
        this.fire_left_3 = new Image();
        this.fire_left_3.src = "/static/images/arkanoid/cyberdemon_left3.png";
        this.fire_left_4 = new Image();
        this.fire_left_4.src = "/static/images/arkanoid/cyberdemon_left4.png";
        this.fire_right_1 = new Image();
        this.fire_right_1.src = "/static/images/arkanoid/cyberdemon_right1.png";
        this.fire_right_2 = new Image();
        this.fire_right_2.src = "/static/images/arkanoid/cyberdemon_right2.png";
        this.fire_right_3 = new Image();
        this.fire_right_3.src = "/static/images/arkanoid/cyberdemon_right3.png";
        this.fire_right_4 = new Image();
        this.fire_right_4.src = "/static/images/arkanoid/cyberdemon_right4.png";

        this.death1 = new Image();
        this.death1.src = "/static/images/arkanoid/cyberdemon_death1.png";
        this.death2 = new Image();
        this.death2.src = "/static/images/arkanoid/cyberdemon_death2.png";
        this.death3 = new Image();
        this.death3.src = "/static/images/arkanoid/cyberdemon_death3.png";
        this.death4 = new Image();
        this.death4.src = "/static/images/arkanoid/cyberdemon_death4.png";
        this.death5 = new Image();
        this.death5.src = "/static/images/arkanoid/cyberdemon_death5.png";
        this.death6 = new Image();
        this.death6.src = "/static/images/arkanoid/cyberdemon_death6.png";
        this.death7 = new Image();
        this.death7.src = "/static/images/arkanoid/cyberdemon_death7.png";
        this.death8 = new Image();
        this.death8.src = "/static/images/arkanoid/cyberdemon_death8.png";
        this.death9 = new Image();
        this.death9.src = "/static/images/arkanoid/cyberdemon_death9.png";
        this.death10 = new Image();
        this.death10.src = "/static/images/arkanoid/cyberdemon_death10.png";

        this.fire_sound = "/static/sound/cyber_fire.wav";
        this.death_sound = "/static/sound/cyber_death.wav";
        this.injured_sound = "/static/sound/cyber_injured.wav";
    }

    draw() {
        if (!this.shooting && !this.dead && this.frame_count <= 120) {
            this.frame_count++;
        }
        if (!this.shooting && !this.dead && this.frame_count > 120) {
            this.frame_count = 0;
        }

        if (this.dead && this.frame_count < 200) {
            this.frame_count++;
        }

        if (this.shooting && this.frame_count <= 120) {
            this.frame_count++;
        }
        if (this.shooting && this.frame_count > 120) {
            this.shooting = false;
            this.frame_count = 0;
        }

        if (!this.dead && this.shooting && this.frame_count <= 10) {
            if (this.x < ball.x) {
                this.context.drawImage(this.fire_right_1, this.x, this.y);
                return;
            }
            if (this.x > ball.x) {
                this.context.drawImage(this.fire_left_1, this.x, this.y);
                return;
            }
        }
        if (!this.dead && this.shooting && this.frame_count <= 40) {
            if (this.x < ball.x) {
                this.context.drawImage(this.fire_right_2, this.x, this.y);
                return;
            }
            if (this.x > ball.x) {
                this.context.drawImage(this.fire_left_2, this.x, this.y);
                return;
            }
        }
        if (!this.dead && this.shooting && this.frame_count <= 80) {
            if (this.x < ball.x) {
                this.context.drawImage(this.fire_right_3, this.x, this.y);
                return;
            }
            if (this.x > ball.x) {
                this.context.drawImage(this.fire_left_3, this.x, this.y);
                return;
            }
        }

        if (!this.dead && this.shooting && this.frame_count <= 120) {
            if (this.x < ball.x) {
                this.context.drawImage(this.fire_right_4, this.x, this.y);
                return;
            }
            if (this.x > ball.x) {
                this.context.drawImage(this.fire_left_4, this.x, this.y);
                return;
            }
        }

        if (!this.dead && this.frame_count <= 30) {
            this.context.drawImage(this.animation1, this.x, this.y);
            return;
        }
        if (!this.dead && this.frame_count <= 60) {
            this.context.drawImage(this.animation2, this.x, this.y);
            return;
        }
        if (!this.dead && this.frame_count <= 90) {
            this.context.drawImage(this.animation3, this.x, this.y);
            return;
        }
        if (!this.dead && this.frame_count <= 120) {
            this.context.drawImage(this.animation4, this.x, this.y);
            return;
        }

        if (this.dead && this.frame_count <= 10) {
            let height_diff = this.height - this.death1.height;
            let width_diff = (this.width - this.death1.width) / 2;
            this.context.drawImage(this.death1, this.x + width_diff, this.y + height_diff);
            return;
        }
        if (this.dead && this.frame_count <= 20) {
            let height_diff = this.height - this.death2.height;
            let width_diff = (this.width - this.death2.width) / 2;
            this.context.drawImage(this.death2, this.x + width_diff, this.y + height_diff);
            return;
        }
        if (this.dead && this.frame_count <= 30) {
            let height_diff = this.height - this.death3.height;
            let width_diff = (this.width - this.death3.width) / 2;
            this.context.drawImage(this.death3, this.x + width_diff, this.y + height_diff);
            return;
        }
        if (this.dead && this.frame_count <= 40) {
            let height_diff = this.height - this.death4.height;
            let width_diff = (this.width - this.death4.width) / 2;
            this.context.drawImage(this.death4, this.x + width_diff, this.y + height_diff);
            return;
        }
        if (this.dead && this.frame_count <= 50) {
            let height_diff = this.height - this.death5.height;
            let width_diff = (this.width - this.death5.width) / 2;
            this.context.drawImage(this.death5, this.x + width_diff, this.y + height_diff);
            return;
        }
        if (this.dead && this.frame_count <= 60) {
            let height_diff = this.height - this.death6.height;
            let width_diff = (this.width - this.death6.width) / 2;
            this.context.drawImage(this.death6, this.x + width_diff, this.y + height_diff);
            return;
        }
        if (this.dead && this.frame_count <= 70) {
            let height_diff = this.height - this.death7.height;
            let width_diff = (this.width - this.death7.width) / 2;
            this.context.drawImage(this.death7, this.x + width_diff, this.y + height_diff);
            return;
        }
        if (this.dead && this.frame_count <= 80) {
            let height_diff = this.height - this.death8.height;
            let width_diff = (this.width - this.death8.width) / 2;
            this.context.drawImage(this.death8, this.x + width_diff, this.y + height_diff);
            return;
        }
        if (this.dead && this.frame_count <= 90) {
            let height_diff = this.height - this.death9.height;
            let width_diff = (this.width - this.death9.width) / 2;
            this.context.drawImage(this.death9, this.x + width_diff, this.y + height_diff);
            return;
        }
        if (this.dead && this.frame_count <= 200) {
            let height_diff = this.height - this.death10.height;
            let width_diff = (this.width - this.death10.width) / 2;
            this.context.drawImage(this.death10, this.x + width_diff, this.y + height_diff);
        }
    }

    hp_indicator() {
        this.context.lineWidth = 1;
        this.context.strokeStyle = "black";
        this.context.fillStyle = "green";
        this.context.beginPath();
        this.context.rect(39, 38, config.CANVAS_WIDTH - 78, 10);
        this.context.fill();
        this.context.stroke();
        this.context.fillStyle = "red";
        this.context.fillRect(config.CANVAS_WIDTH - 39, 39, -(config.CANVAS_WIDTH - 78) / this.full_hp * (this.full_hp - this.hp), 8)
        this.context.closePath();
    }

    move() {
        let _step = Math.PI / 600;
        let _root2 = Math.sqrt(2);
        let _a = 200;

        let cos = Math.cos(this._phi);
        let sin = Math.sin(this._phi);
        let sin_sq = Math.pow(Math.sin(this._phi), 2) + 1;

        let x = _a * _root2 * cos / sin_sq;
        let y = _a * _root2 * cos * sin / sin_sq;
        this._phi += _step;
        if (this._phi >= Math.PI * 2 + _step) {
            this._phi = 0;
        }
        this.x = x + config.CANVAS_WIDTH / 2 - this.width / 2;
        this.y = y + config.CANVAS_HEIGHT / 2 - 150;
    }

    checkForShooting() {
        if (!this.dead) {
            if (this.shooting_delay === 40) {
                this.frame_count = 0;
            }

            if (this.shooting_delay < 40) {
                this.shooting = true;
            }

            if (this.shooting && this.shooting_delay === 0 && this.rockets_fired < this.rockets_in_row) {
                this.rockets_fired++;
                play_audio(this.fire_sound);
                if (this.x + this.width / 2 < ball.x) {
                    rockets.push(new Rocket(this.context, "rocket", this.x + this.width + 15, this.y + this.height / 2 - 10));
                } else {
                    rockets.push(new Rocket(this.context, "rocket", this.x + 15, this.y + this.height / 2));
                }
                this.shooting_delay = 10;
            }

            if (this.shooting_delay > 0) {
                this.shooting_delay--;
            }

            if (this.rockets_fired === this.rockets_in_row) {
                this.shooting_delay = 200 + Math.floor(Math.random() * 200);
                this.rockets_fired = 0;
            }
        }
    }

    ballCollision() {
        if ((!this.dead) && (!ball.fall) && (ball.y + ball.radius > this.y + 10) && (ball.y - ball.radius < this.y + this.height - 10)
            && (ball.x + ball.radius > this.x + 10) && (ball.x - ball.radius < this.x + this.width - 10)) {
            this.hp -= ball.damage;
            play_audio(ball.attack_sound);
            if (this.hp <= 0) {
                this.dead = true;
                this.frame_count = 0;
                lives += Math.round(this.lvl / 5);
                play_audio(this.death_sound);
                game_score += this.score;
                score_list.push(new Score_obj(this.context, this.score, this.x + this.width / 2, this.y + this.height / 2));
            } else {
                this.shooting_delay += 20;
                this.rockets_fired = 0;
                play_audio(this.injured_sound);

                let vector = [ball.x - (this.x + this.width / 2), ball.y - (this.y + this.height / 2)];
                let length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
                ball.speed = [(vector[0] / length * ball.start_speed), (vector[1] / length * ball.start_speed)];
                ball.change_acceleration([vector[0] / length * 5, vector[1] / length * 5]);
            }
            this.shooting = false;
            ball.animation = true;
        }
    }
}

class Projectile {
    constructor(context, type, x, y) {
        this.context = context;
        this.x = x;
        this.y = y;
        this.type = type;

        let vector = [ball.x - this.x, ball.y - this.y];
        let length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
        this.speed = [vector[0] / length * 3, vector[1] / length * 3];
        this.acceleration = [0, 0];
        this.acceleration_multiplier = 0.0005;

        this.frame_count = 0;
        this.explode = false;

        this.image1 = new Image();
        this.image1.src = "/static/images/arkanoid/" + type + "1.png";
        this.image2 = new Image();
        this.image2.src = "/static/images/arkanoid/" + type + "2.png";

        this.animation1 = new Image();
        this.animation1.src = "/static/images/arkanoid/" + type + "_explosion1.png";
        this.animation2 = new Image();
        this.animation2.src = "/static/images/arkanoid/" + type + "_explosion2.png";
        this.animation3 = new Image();
        this.animation3.src = "/static/images/arkanoid/" + type + "_explosion3.png";

        this.explosion_sound = "/static/sound/" + type + "_explosion.wav"
    }

    draw() {
        if (this.explode && this.frame_count < 30) {
            this.frame_count++;
        }

        if (this.explode && this.frame_count < 10) {
            let width_diff = (this.width - this.animation1.width) / 2;
            let height_diff = (this.height - this.animation1.height) / 2;
            this.context.drawImage(this.animation1, this.x - this.radius + width_diff, this.y - this.radius + height_diff);
            return;
        }
        if (this.explode && this.frame_count < 20) {
            let width_diff = (this.width - this.animation2.width) / 2;
            let height_diff = (this.height - this.animation2.height) / 2;
            this.context.drawImage(this.animation2, this.x - this.radius + width_diff, this.y - this.radius + height_diff);
            return;
        }
        if (this.explode && this.frame_count <= 30) {
            let width_diff = (this.width - this.animation3.width) / 2;
            let height_diff = (this.height - this.animation3.height) / 2;
            this.context.drawImage(this.animation3, this.x - this.radius + width_diff, this.y - this.radius + height_diff);
            return;
        }

        let cos = this.speed[0] / Math.sqrt(this.speed[0] * this.speed[0] + this.speed[1] * this.speed[1]);

        let angle = Math.acos(cos);
        this.context.save();
        this.context.translate(this.x, this.y);
        if (this.speed[1] > 0) {
            this.context.rotate(angle);
        } else {
            this.context.rotate(-angle);
        }
        if (this.frame_count < 10) {
            this.context.drawImage(this.image1, 0, 0);
        } else {
            this.context.drawImage(this.image2, 0, 0);
        }
        if (this.frame_count < 20) {
            this.frame_count++;
        } else {
            this.frame_count = 0;
        }
        this.context.restore();
    }

    move() {
        if (!this.explode) {
            this.x += this.speed[0];
            this.y += this.speed[1];

            this.speed[0] += this.acceleration[0];
            this.speed[1] += this.acceleration[1];

            let acceleration_vector = [ball.x - this.x, ball.y - this.y];

            if (ball.invisibility_duration === 0) {
                this.acceleration = [acceleration_vector[0] * this.acceleration_multiplier, acceleration_vector[1] * this.acceleration_multiplier];
            } else {
                this.acceleration = [this.speed[0] * this.acceleration_multiplier, this.speed[1] * this.acceleration_multiplier];
            }
        }
    }

    collision() {
        if (!this.explode && ((this.x - this.radius < 0) || (this.x + this.radius > config.CANVAS_WIDTH)
            || (this.y - this.radius < 0) || (this.y + this.radius > config.CANVAS_HEIGHT))) {
            this.explode = true;
            play_audio(this.explosion_sound);
            this.speed = [0, 0];
        }

        if (!this.explode) {
            let distX = this.x - ball.x;
            let distY = this.y - ball.y;
            let distance = Math.sqrt(distX * distX + distY * distY);
            if (distance <= this.radius + ball.radius) {
                this.explode = true;
                if (ball.onPaddle) {
                    ball.onPaddle = false;
                    ball.speed = this.speed;
                }
                play_audio(this.explosion_sound);
                let vector = [ball.x - this.x, ball.y - this.y];
                let length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);

                switch (this.type) {
                    case "rocket":
                        ball.speed = [(vector[0] / length * ball.start_speed), (vector[1] / length * ball.start_speed)];
                        ball.change_acceleration([vector[0] / length * 10, vector[1] / length * 10]);
                        break;
                    case "red_fire":
                        ball.speed_duration += 50;
                        ball.change_acceleration([vector[0] / length * 10, vector[1] / length * 10]);
                        break;
                    case "green_fire":
                        ball.speed = [ball.speed[0] / 2, ball.speed[1] / 2];
                        ball.change_acceleration([vector[0] / length * 5, vector[1] / length * 5]);
                }
                ball.change_hp(-1);
            }
        }
    }
}

class Rocket extends Projectile {
    constructor(context, type, x, y) {
        super(context, type, x, y)
        this.width = 26;
        this.height = 14;

        this.radius = 10;
    }
}

class Red_fire extends Projectile {
    constructor(context, type, x, y) {
        super(context, type, x, y)
        this.width = 26;
        this.height = 10;
        this.radius = 10;
        this.acceleration_multiplier = 0.0001;
    }
}

class Green_fire extends Projectile {
    constructor(context, type, x, y) {
        super(context, type, x, y)
        this.width = 27;
        this.height = 10;

        this.radius = 10;
        this.acceleration_multiplier = 0.0003;
    }
}

class Torch {
    constructor(context, x, y) {
        this.context = context;
        this.x = x;
        this.width = 26;
        this.height = 96;
        this.y = y - this.height;
        this.frame_count = Math.floor(Math.random() * 41);

        this.animation1 = new Image();
        this.animation1.src = "/static/images/arkanoid/torch1.png";
        this.animation2 = new Image();
        this.animation2.src = "/static/images/arkanoid/torch2.png";
        this.animation3 = new Image();
        this.animation3.src = "/static/images/arkanoid/torch3.png";
        this.animation4 = new Image();
        this.animation4.src = "/static/images/arkanoid/torch4.png";
    }

    draw() {
        if (this.frame_count < 40) {
            this.frame_count++;
        } else {
            this.frame_count = 0;
        }
        if (this.frame_count <= 10) {
            this.context.drawImage(this.animation1, this.x, this.y);
            return;
        }

        if (this.frame_count <= 20) {
            this.context.drawImage(this.animation2, this.x, this.y);
            return;
        }

        if (this.frame_count <= 30) {
            this.context.drawImage(this.animation3, this.x, this.y);
            return;
        }

        if (this.frame_count <= 40) {
            this.context.drawImage(this.animation4, this.x, this.y);
        }
    }
}

class Debris {
    constructor(context, image_src, x, y, intersection) {
        this.context = context;
        this.x = [x, x, x, x];
        this.y = [y, y, y, y];
        this.width = config.BRICK_WIDTH;
        this.height = config.BRICK_HEIGHT;
        this.image = new Image();
        this.image.src = image_src;
        this.degrees = [0, 0, 0, 0];
        this.speed_x = [0, 0, 0, 0];
        this.speed_y = [0, 0, 0, 0];

        this.intersection = [intersection[0] - this.x[0] - this.width / 2, intersection[1] - this.y[0] - this.height / 2];
    }

    draw() {
        this.context.strokeStyle = "black";
        this.context.lineWidth = 3;

        for (let i = 0; i < 4; i++) {
            this.context.save();
            this.context.translate(this.x[i] + this.width / 2, this.y[i] + this.height / 2);
            this.context.rotate(this.degrees[i] * Math.PI / 180);
            this.create_shard(i);
            this.context.drawImage(this.image, -this.width / 2, -this.height / 2);
            this.context.closePath();
            this.draw_crack(i);
            this.context.restore();
            if (i <= 1) {
                this.degrees[i] = (this.degrees[i] + Math.random() * 3) % 360;
                this.x[i] -= this.speed_x[i] + Math.random() * 1.5;
            } else {
                this.degrees[i] = (this.degrees[i] - Math.random() * 3) % 360;
                this.x[i] += this.speed_x[i] + Math.random() * 1.5;
            }
            this.y[i] += this.speed_y[i];
            this.speed_y[i] += config.FALLING_SPEED + Math.random() / 5;
        }
    }

    create_shard(i) {
        if (i === 0) {
            this.context.beginPath();
            this.context.moveTo(-this.width / 2, -this.height / 2);
            this.context.lineTo(this.intersection[0], this.intersection[1]);
            this.context.lineTo(-this.width / 2, this.height / 2);
            this.context.clip();
        }
        if (i === 1) {
            this.context.beginPath();
            this.context.moveTo(this.width / 2, -this.height / 2);
            this.context.lineTo(this.intersection[0], this.intersection[1]);
            this.context.lineTo(-this.width / 2, -this.height / 2);
            this.context.clip();
        }
        if (i === 2) {
            this.context.beginPath();
            this.context.moveTo(this.width / 2, -this.height / 2);
            this.context.lineTo(this.intersection[0], this.intersection[1]);
            this.context.lineTo(this.width / 2, this.height / 2);
            this.context.clip();
        }
        if (i === 3) {
            this.context.beginPath();
            this.context.moveTo(-this.width / 2, this.height / 2);
            this.context.lineTo(this.intersection[0], this.intersection[1]);
            this.context.lineTo(this.width / 2, this.height / 2);
            this.context.clip();
        }
    }

    draw_crack(i) {
        if (i === 0) {
            this.context.beginPath();
            this.context.moveTo(-this.width / 2, -this.height / 2);
            this.context.lineTo(this.intersection[0], this.intersection[1]);
            this.context.lineTo(-this.width / 2, this.height / 2);
            this.context.closePath();
            this.context.stroke();
        }
        if (i === 1) {
            this.context.beginPath();
            this.context.moveTo(this.width / 2, -this.height / 2);
            this.context.lineTo(this.intersection[0], this.intersection[1]);
            this.context.lineTo(-this.width / 2, -this.height / 2);
            this.context.closePath();
            this.context.stroke();
        }
        if (i === 2) {
            this.context.beginPath();
            this.context.moveTo(this.width / 2, -this.height / 2);
            this.context.lineTo(this.intersection[0], this.intersection[1]);
            this.context.lineTo(this.width / 2, this.height / 2);
            this.context.closePath();
            this.context.stroke();
        }
        if (i === 3) {
            this.context.beginPath();
            this.context.moveTo(-this.width / 2, this.height / 2);
            this.context.lineTo(this.intersection[0], this.intersection[1]);
            this.context.lineTo(this.width / 2, this.height / 2);
            this.context.closePath();
            this.context.stroke();
        }
    }
}

class Score_obj {
    constructor(context, score, x, y) {
        this.context = context;
        this.score = score;
        this.x = x;
        this.y = y;
        if (this.score < 500) {
            this.font = "24px roboto";
        } else {
            this.font = "bold 36px roboto";
        }
        this.opacity = 1;
        this.status = "exist"
    }

    draw() {
        this.context.textAlign = "center";
        this.context.fillStyle = "#000000";
        this.context.font = this.font;
        this.context.globalAlpha = this.opacity;
        this.context.fillText(this.score, this.x, this.y);
        this.context.globalAlpha = 1;
        if (this.score < 500) {
            this.opacity -= 0.03;
        } else {
            this.opacity -= 0.01;
        }
        if (this.opacity <= 0) {
            this.status = "for_delete";
        }
    }

    move() {
        if (this.score < 500) {
            this.y -= 1;
        } else {
            this.y -= 0.5;
        }
    }
}

class Message {
    constructor(context, text) {
        this.context = context;
        this.font = "36px roboto";
        this.opacity = 1;
        this.text = text;
        this.status = "exist"
    }

    draw() {
        this.context.textAlign = "center";
        this.context.fillStyle = "#000000";
        this.context.font = this.font;
        this.context.globalAlpha = this.opacity;
        this.context.fillText(this.text, config.CANVAS_WIDTH / 2, config.CANVAS_HEIGHT / 2);
        this.context.globalAlpha = 1;
        this.opacity -= 0.002;
        if (this.opacity <= 0) {
            this.status = "for_delete";
        }
    }
}

function play_audio(path) {
    if (!muted) {
        let audio = new Audio(path);
        audio.play();
    }
}




