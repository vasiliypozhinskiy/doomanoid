class Enemy {
    TYPE;

    HEIGHT;
    WIDTH;
    SCORE;
    context = context;

    STANDING_MAX_FRAME_COUNT = 120;
    SHOOTING_MAX_FRAME_COUNT = 120;
    DEATH_MAX_FRAME_COUNT = 60;
    INJURED_MAX_FRAME_COUNT = 30;

    IMG_STATIC_URL = config.IMG_STATIC_URL;
    SOUND_STATIC_URL = config.SOUND_STATIC_URL;

    FIRE_RATE;
    MIN_SHOOTING_DELAY;

    constructor(x, y, type) {
        this.TYPE = type

        this.x = x;
        this.y = y;

        this.frame_count = Math.floor(Math.random() * (120));

        this.shots_fired = 0;
        this.shots_in_row = 1;

        this.onBrick = true;
        this.dead = false;
        this.injured = false;
        this.shooting = false;

        this.speed = [0, 0];

        this.animation1 = new Image();
        this.animation1.src = this.IMG_STATIC_URL + this.TYPE + "1.png";
        this.animation2 = new Image();
        this.animation2.src = this.IMG_STATIC_URL + this.TYPE + "2.png";
        this.animation3 = new Image();
        this.animation3.src = this.IMG_STATIC_URL + this.TYPE + "3.png";
        this.animation4 = new Image();
        this.animation4.src = this.IMG_STATIC_URL + this.TYPE + "4.png";

        this.fire_left_1 = new Image();
        this.fire_left_1.src = this.IMG_STATIC_URL + this.TYPE + "_fire_left1.png";
        this.fire_left_2 = new Image();
        this.fire_left_2.src = this.IMG_STATIC_URL + this.TYPE + "_fire_left2.png";
        this.fire_left_3 = new Image();
        this.fire_left_3.src = this.IMG_STATIC_URL + this.TYPE + "_fire_left3.png";
        this.fire_right_1 = new Image();
        this.fire_right_1.src = this.IMG_STATIC_URL + this.TYPE + "_fire_right1.png";
        this.fire_right_2 = new Image();
        this.fire_right_2.src = this.IMG_STATIC_URL + this.TYPE + "_fire_right2.png";
        this.fire_right_3 = new Image();
        this.fire_right_3.src = this.IMG_STATIC_URL + this.TYPE + "_fire_right3.png";

        this.death1 = new Image();
        this.death1.src = this.IMG_STATIC_URL + this.TYPE + "_death1.png";
        this.death2 = new Image();
        this.death2.src = this.IMG_STATIC_URL + this.TYPE + "_death2.png";
        this.death3 = new Image();
        this.death3.src = this.IMG_STATIC_URL + this.TYPE + "_death3.png";
        this.death4 = new Image();
        this.death4.src = this.IMG_STATIC_URL + this.TYPE + "_death4.png";
        this.death5 = new Image();
        this.death5.src = this.IMG_STATIC_URL + this.TYPE + "_death5.png";
        this.death6 = new Image();
        this.death6.src = this.IMG_STATIC_URL + this.TYPE + "_death6.png";

        this.fire_sound = this.SOUND_STATIC_URL + this.TYPE + "_fire.wav";
        this.death_sound_1 = this.SOUND_STATIC_URL + this.TYPE + "_death1.wav";
        this.death_sound_2 = this.SOUND_STATIC_URL + this.TYPE + "_death2.wav";
    }

    draw() {
        this.checkFrameCount();

        let currentImage = this.getCurrentImage();
        let height_diff = this.HEIGHT - currentImage.height;
        this.context.drawImage(currentImage, this.x, this.y + height_diff);
    }

    checkFrameCount() {
        if (!this.shooting && !this.dead && this.frame_count === this.STANDING_MAX_FRAME_COUNT) {
            this.frame_count = 0;
        }

        if (this.shooting && this.frame_count === this.SHOOTING_MAX_FRAME_COUNT) {
            this.shooting = false;
            this.frame_count = 0;
        }

        if (this.injured && this.frame_count === this.INJURED_MAX_FRAME_COUNT) {
            this.injured = false;
            this.frame_count = 0;
        }

        if (!this.dead || this.frame_count < this.DEATH_MAX_FRAME_COUNT) {
            this.frame_count++;
        }
    }

    getCurrentImage() {
        if (this.shooting) {
            return this.shootingAnimation();
        }

        if (this.injured) {
            return this.injureAnimation();
        }

        if (!this.dead) {
            return this.standingAnimation();
        } else {
            return this.deathAnimation();
        }
    }

    shootingAnimation() {
        let side = this.x > ball.x ? 'left' : 'right';
        let animationStep;

        if (this.frame_count <= 120) {
            animationStep = 3;
        }
        if (this.frame_count <= 40) {
            animationStep = 2;
        }
        if (this.frame_count <= 10) {
            animationStep = 1;
        }

        return eval('this.fire_' + side + '_' + animationStep)
    }

    injureAnimation() {
        if (this.frame_count <= this.INJURED_MAX_FRAME_COUNT) {
            return this.injure
        }
    }

    standingAnimation() {
        let currentImage;
        if (this.frame_count <= this.STANDING_MAX_FRAME_COUNT) {
            currentImage = this.animation1;
        }
        if (this.frame_count <= 90) {
           currentImage = this.animation2;
        }
        if (this.frame_count <= 60) {
            currentImage = this.animation3;
        }
        if (this.frame_count <= 30) {
            currentImage = this.animation2;
        }
        return currentImage
    }

    deathAnimation() {
        let currentImage = this.death6;

        for (let i = 6; i > 0; i--) {
            if (this.frame_count <= i * 10) {
                currentImage = eval('this.death' + i);
            }
        }
        return currentImage
    }

    move() {
        if (!this.onBrick) {
            this.y += this.speed[1];
            this.speed[1] += config.FALLING_SPEED;
        }

        if (this.x > 0 && this.x + this.WIDTH < config.CANVAS_WIDTH) {
            this.x += this.speed[0];
        }

        if (this.y + this.HEIGHT > config.CANVAS_HEIGHT) {
            this.speed = [0, 0];
            if (!this.dead) {
                this.frame_count = 0;
                this.dead = true;
                play_audio(this.death_sound_2);
                game_score += this.SCORE;
                score_list.push(new Score_obj(this.context, this.SCORE, this.x + this.WIDTH / 2, this.y + this.HEIGHT / 2));
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
            if ((this.y + this.HEIGHT > brick.y) && (this.y < brick.y + brick.HEIGHT)
                && (this.x + this.WIDTH / 2 > brick.x) && (this.x + this.WIDTH / 2 < brick.x + brick.WIDTH)
                && (this.y + this.HEIGHT - 5 <= brick.y)) {
                this.onBrick = true;
                this.speed[1] = 0;
            }
        }
    }

    ballCollision() {
        if ((!this.dead) && (!ball.fall) && (ball.y + ball.radius > this.y) && (ball.y - ball.radius < this.y + this.HEIGHT)
            && (ball.x + ball.radius > this.x) && (ball.x - ball.radius < this.x + this.WIDTH)) {
            this.frame_count = 0;
            this.hp -= ball.damage;
            if (this.hp <= 0 || !this.onBrick) {
                this.processDeath();
            } else {
                this.shooting_delay += 50;
                this.injured = true;
                play_audio(this.injured_sound);

                let vector = [ball.x - (this.x + this.WIDTH / 2), ball.y - (this.y + this.HEIGHT / 2)];
                let length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
                ball.speed = [(vector[0] / length * ball.start_speed), (vector[1] / length * ball.start_speed)];
                ball.change_acceleration([vector[0] / length * 5, vector[1] / length * 5]);
            }
            this.shooting = false;
            play_audio(ball.attack_sound);
            ball.animation = true;
        }
    }

    processDeath() {
        if (this.x < ball.x) {
            this.speed[0] = -3 - Math.random();
        } else {
            this.speed[0] = 3 + Math.random();
        }
        this.dead = true;
        this.frame_count = 0;
        play_audio(this.death_sound_1);
        game_score += this.SCORE * 2;
        score_list.push(new Score_obj(this.context, this.SCORE * 2, this.x + this.WIDTH / 2, this.y + this.HEIGHT / 2));
    }

    checkForShooting() {
        if (!this.dead && this.onBrick) {
            if (this.shooting_delay === 40) {
                this.frame_count = 0;
            }

            if (this.shooting_delay < 40) {
                this.shooting = true;
            }

            if (this.shooting && this.shooting_delay === 0 && this.shots_fired < this.shots_in_row) {
                this.shoot();
                this.shots_fired++;
            }

            if (this.shooting_delay > 0) {
                this.shooting_delay--;
            }
            if (this.shots_fired === this.shots_in_row) {
                this.shooting_delay = this.MIN_SHOOTING_DELAY + Math.floor(Math.random() * this.FIRE_RATE);
                this.shots_fired = 0;
            }
        }
    }

    shoot() {
        throw new Error("Abstract method!");
    }
}

class Doomguy extends Enemy {
    SCORE = 100;
    HEIGHT = 40;
    WIDTH = 30;

    constructor(x, y) {
        super(x, y, 'doomguy')
        this.x = x + 30;
        this.y = y - this.HEIGHT;

        this.hp = 10;

        this.fire_left_3 = this.fire_left_1;
        this.fire_right_3 = this.fire_right_1;
    }

    checkForShooting() {
        if (this.onBrick && !this.dead) {
            let distX = this.x - ball.x;
            let distY = this.y - ball.y;
            let distance = Math.sqrt(distX * distX + distY * distY);
            if ((distance <= ball.radius + 100) &&
                (this.y < ball.y + ball.radius - 10) && (this.y + this.HEIGHT > ball.y - ball.radius + 10)) {
                if (!this.shooting && ball.invisibility_duration === 0) {
                    this.shoot();
                }
            }
        }
    }

    shoot() {
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

class Imp extends Enemy {
    SCORE = 100;
    HEIGHT = 40;
    WIDTH = 30;

    MIN_SHOOTING_DELAY = 400;
    FIRE_RATE = 400;

    constructor(x, y) {
        super(x, y, 'imp')
        this.x = x + 30;
        this.y = y - this.HEIGHT;

        this.shooting_delay = this.MIN_SHOOTING_DELAY + Math.floor(Math.random() * this.FIRE_RATE);

        this.hp = 10;
    }

    shoot() {
        play_audio(this.fire_sound);
        if (this.x + this.WIDTH / 2 < ball.x) {
            projectiles.push(new Red_fire(this.context, "red_fire", this.x + this.WIDTH, this.y + this.HEIGHT / 2 - 5));
        } else {
            projectiles.push(new Red_fire(this.context, "red_fire", this.x, this.y + this.HEIGHT / 2 - 5));
        }
        this.shooting_delay = this.MIN_SHOOTING_DELAY + Math.floor(Math.random() * this.FIRE_RATE)
    }
}

class Baron extends Enemy {
    SCORE = 200;
    HEIGHT = 50;
    WIDTH = 30;

    MIN_SHOOTING_DELAY = 300;
    FIRE_RATE = 300;

    constructor(x, y) {
        super(x, y, 'baron')
        this.x = x + 30;
        this.y = y - this.HEIGHT;

        this.hp = 30;

        this.shooting_delay = this.MIN_SHOOTING_DELAY + Math.floor(Math.random() * this.FIRE_RATE);

        this.injured_sound = "/static/sound/" + this.TYPE + "_injured.wav";
        this.injure = new Image();
        this.injure.src = "/static/images/arkanoid/" + this.TYPE + "_injured.png";
    }

    shoot() {
        play_audio(this.fire_sound);
        if (this.x + this.WIDTH / 2 < ball.x) {
            projectiles.push(new Green_fire(this.context, "green_fire", this.x + this.WIDTH, this.y + this.HEIGHT / 2 - 5));
        } else {
            projectiles.push(new Green_fire(this.context, "green_fire", this.x, this.y + this.HEIGHT / 2 - 5));
        }
        this.shooting_delay = this.MIN_SHOOTING_DELAY + Math.floor(Math.random() * this.FIRE_RATE)
    }
}

class Arachnotron extends Enemy {
    MIN_SHOOTING_DELAY = 500;
    FIRE_RATE = 500;

    SCORE = 400;

    HEIGHT = 44;
    WIDTH = 80

    constructor(x, y) {
        super(x, y, 'arachnotron')
        this.x = x;
        this.y = y - this.HEIGHT;

        this.shooting_delay = this.MIN_SHOOTING_DELAY + Math.floor(Math.random() * this.FIRE_RATE);
        this.shots_in_row = 5;

        this.hp = 50;

        this.injure = new Image();
        this.injure.src = this.IMG_STATIC_URL + this.TYPE + "_injured.png";

        this.injured_sound = this.SOUND_STATIC_URL + this.TYPE + "_injured.wav";
        this.death_sound_2 = this.death_sound_1
    }

    shoot() {
        play_audio(this.fire_sound);
        if (this.x + this.WIDTH / 2 < ball.x) {
            projectiles.push(new Yellow_plasma(this.context, "yellow_plasma", this.x + this.WIDTH - 30, this.y + this.HEIGHT / 2));
        } else {
            projectiles.push(new Yellow_plasma(this.context, "yellow_plasma", this.x + 30, this.y + this.HEIGHT / 2));
        }
        this.shooting_delay = 5
    }
}

class Cyberdemon extends Enemy {
    DEATH_MAX_FRAME_COUNT = 120;
    SHOOTING_MAX_FRAME_COUNT = 120;

    HEIGHT = 110;
    WIDTH = 88;

    MIN_SHOOTING_DELAY = 200;
    FIRE_RATE = 200;

    constructor(lvl) {
        super(config.CANVAS_WIDTH / 2, config.CANVAS_HEIGHT / 2, 'cyberdemon');
        this.frame_count = Math.floor(Math.random() * 120);
        this._phi = 0;
        this.lvl = lvl;

        this.shooting_delay = this.MIN_SHOOTING_DELAY + Math.floor(Math.random() * this.FIRE_RATE);
        this.shots_in_row = Math.floor(this.lvl / 5) + 2;

        this.SCORE = 200 * this.lvl;
        this.hp = 10 * this.lvl;
        this.full_hp = this.hp;

        this.animation4 = new Image();
        this.animation4.src = "/static/images/arkanoid/cyberdemon4.png";

        this.fire_left_4 = new Image();
        this.fire_left_4.src = "/static/images/arkanoid/cyberdemon_fire_left4.png";
        this.fire_right_4 = new Image();
        this.fire_right_4.src = "/static/images/arkanoid/cyberdemon_fire_right4.png";

        this.death7 = new Image();
        this.death7.src = "/static/images/arkanoid/cyberdemon_death7.png";
        this.death8 = new Image();
        this.death8.src = "/static/images/arkanoid/cyberdemon_death8.png";
        this.death9 = new Image();
        this.death9.src = "/static/images/arkanoid/cyberdemon_death9.png";
        this.death10 = new Image();
        this.death10.src = "/static/images/arkanoid/cyberdemon_death10.png";

        this.injure = this.animation1;

        this.fire_sound = "/static/sound/cyber_fire.wav";
        this.death_sound_1 = "/static/sound/cyber_death.wav";
        this.injured_sound = "/static/sound/cyber_injured.wav";
    }

    shootingAnimation() {
        let side = this.x > ball.x ? 'left' : 'right';
        let animationStep;

        if (this.frame_count <= 120) {
            animationStep = 4;
        }
        if (this.frame_count <= 80) {
            animationStep = 3;
        }
        if (this.frame_count <= 40) {
            animationStep = 2;
        }
        if (this.frame_count <= 10) {
            animationStep = 1;
        }

        return eval('this.fire_' + side + '_' + animationStep)
    }

    standingAnimation() {
        let currentImage;

        for (let i = 4; i > 0; i--) {
            if (this.frame_count <= i * 30) {
                currentImage = eval('this.animation' + i)
            }
        }
        return currentImage
    }

    deathAnimation() {
        let currentImage = this.death10;

        for (let i = 9; i > 0; i--) {
            if (this.frame_count <= i * 10) {
                currentImage = eval('this.death' + i);
            }
        }
        return currentImage
    }

    draw_hp_indicator() {
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
        this.x = x + config.CANVAS_WIDTH / 2 - this.WIDTH / 2;
        this.y = y + config.CANVAS_HEIGHT / 2 - 150;
    }

    shoot() {
        play_audio(this.fire_sound);
        if (this.x + this.WIDTH / 2 < ball.x) {
            projectiles.push(new Rocket(this.context, "rocket", this.x + this.WIDTH + 15, this.y + this.HEIGHT / 2 - 10));
        } else {
            projectiles.push(new Rocket(this.context, "rocket", this.x + 15, this.y + this.HEIGHT / 2));
        }
        this.shooting_delay = 10;
    }

    brickCollision(bricks) {
        this.onBrick = true;
    }

    processDeath() {
        super.processDeath();
        lives += Math.round(this.lvl / 5);
    }
}