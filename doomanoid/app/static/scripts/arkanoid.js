"use strict";

const canvas = document.getElementById("arkanoid");
const context = canvas.getContext("2d");

let stopped = false;
let muted = false;
let fps_enable = false;
let lvl_ended = false;

let left_arrow_pressed = false;
let right_arrow_pressed = false;
let up_arrow_pressed = false;
let down_arrow_pressed = false;
let space_pressed = false;

let current_username = null;
let current_score_page = 1;

document.addEventListener("keydown", function (event) {
    switch (event.key) {
        case "ArrowLeft":
            left_arrow_pressed = true;
            break;
        case "ArrowRight":
            right_arrow_pressed = true;
            break;
        case "ArrowUp":
            up_arrow_pressed = true;
            break;
        case "ArrowDown":
            down_arrow_pressed = true;
            break;
        case " ":
            space_pressed = true;
            break;
    }
});

document.addEventListener("keyup", function (event) {
    switch (event.key) {
        case "ArrowLeft":
            left_arrow_pressed = false;
            break;
        case "ArrowRight":
            right_arrow_pressed = false;
            break;
        case "ArrowUp":
            up_arrow_pressed = false;
            break;
        case "ArrowDown":
            down_arrow_pressed = false;
            break;
        case " ":
            space_pressed = false;
            break;
    }
});

const paddle = new Paddle(context, canvas.width / 2 - config.PADDLE_WIDTH / 2, canvas.height - config.PADDLE_HEIGHT - config.OFFSET_Y);
const ball = new Ball(context, canvas.width / 2, paddle.y - config.BALL_RADIUS);

const left_torch = new Torch(context, 0, canvas.height);
const right_torch = new Torch(context, canvas.width - 26, canvas.height);
const SPIKES = new Image();
SPIKES.src = "/static/images/arkanoid/spikes.png";

let bricks = [];
let debris_list = [];
let bonuses = [];
let enemies = [];
let cyberdemon = null;
let projectiles = [];

let score_list = [];
let message_list = [];
let bonus_delay = config.BONUS_DELAY;

let current_lvl = 1;

const start_sound = "/static/sound/newlvl.wav";
let lives = config.LIVES;
let game_score = 0;
let last_score = 0;
let lvl_end_timer = 0;
let invulnerability_trigger = false;

const FRAME_MIN_TIME = (1000 / 60) * (60 / config.FPS) - (1000 / 60) * 0.5;

let last_loop, this_loop;

function start_animation(fps) {
    this_loop = last_loop = performance.now();
    loop();
}

function loop() {
    if (!stopped) {
        this_loop = performance.now()
        if (this_loop - last_loop < FRAME_MIN_TIME) {
            requestAnimationFrame(loop);
        } else {
            context.clearRect(0, 0, 800, 600);

            if (fps_enable) {
                show_fps();
            }

            last_loop = performance.now();

            if (ball.invulnerability_duration > 0 && !invulnerability_trigger) {
                invulnerability_trigger = true;
                $("#arkanoid-background").css({"filter": "grayscale(100%) invert(100%)"});
                $("canvas").css({"filter": "grayscale(100%) invert(100%)"});
            }
            if (ball.invulnerability_duration === 0 && invulnerability_trigger) {
                invulnerability_trigger = false;
                $("#arkanoid-background").css({"filter": "none"});
                $("canvas").css({"filter": "none"});
            }

            if ((lives <= 0) && (ball.frame_count === 100)) {
                $("#background").css({"filter": "none"});
                $("canvas").css({"filter": "none"});
                game_over();
            }

            if (lvl_ended) {
                return;
            }

            left_torch.draw();
            right_torch.draw();

            for (let i = 0; i < debris_list.length; i++) {
                let current_debris = debris_list[i];
                current_debris.draw();
                if (current_debris.y[0] > config.CANVAS_HEIGHT) {
                    debris_list.splice(i, 1);
                }
            }
            if (left_arrow_pressed) {
                paddle.speed[0] = -config.PADDLE_SPEED[0];
            }
            if (right_arrow_pressed) {
                paddle.speed[0] = config.PADDLE_SPEED[0];
            }
            if (up_arrow_pressed) {
                paddle.speed[1] = -config.PADDLE_SPEED[1];
            }
            if (down_arrow_pressed) {
                paddle.speed[1] = config.PADDLE_SPEED[1];
            }
            if (space_pressed) {
                ball.start();
            }

            paddle.move();
            ball.move(paddle);

            paddle.decrease_bonus_duration();
            ball.decrease_bonus_duration();

            ball.wallCollision();
            ball.friction();

            ball.paddleCollision(paddle);
            if (bricks.length === 0) {
                lvl_end_timer++;
            }

            if (lvl_end_timer === 240) {
                current_lvl += 1;
                level_complete(current_lvl);
                return;
            }

            for (let i = 0; i < bricks.length; i++) {
                let current_brick = bricks[i];
                current_brick.move();
                current_brick.draw();
                ball.brickCollision(current_brick);
                if (current_brick.type === "for_delete") {
                    current_brick.create_score_obj(score_list);
                    bricks.splice(i, 1);
                }
            }

            for (let i = 0; i < bonuses.length; i++) {
                let current_bonus = bonuses[i];
                current_bonus.move();
                current_bonus.draw();
                current_bonus.brickCollision(bricks);
                current_bonus.paddleCollision(paddle);
                current_bonus.ballCollision(ball);
                if (current_bonus.type === "for_delete") {
                    bonuses.splice(i, 1);
                }
            }

            for (let i = 0; i < enemies.length; i++) {
                let current_enemy = enemies[i];
                current_enemy.move();
                current_enemy.draw();
                current_enemy.brickCollision(bricks);
                current_enemy.checkForShooting();
                current_enemy.ballCollision();
                current_enemy.friction();
            }

            if (cyberdemon != null) {
                if (cyberdemon.dead && cyberdemon.frame_count === 200) {
                    lvl_end_timer++;
                }
                cyberdemon.move();
                cyberdemon.draw();
                cyberdemon.ballCollision();
                cyberdemon.checkForShooting();
                cyberdemon.hp_indicator();
                random_bonus_generation();
            }

            for (let i = 0; i < projectiles.length; i++) {
                let current_rocket = projectiles[i];
                current_rocket.move();
                current_rocket.draw();
                current_rocket.collision();

                if (current_rocket.explode && current_rocket.frame_count === 30) {
                    projectiles.splice(i, 1);
                }
            }

            paddle.draw();
            ball.random_animation();
            ball.draw();
            draw_hud();
            for (let i = 0; i < score_list.length; i++) {
                let current_score = score_list[i];
                current_score.draw();
                current_score.move();
                if (current_score.status === "for_delete") {
                    score_list.splice(i, 1);
                }
            }

            for (let i = 0; i < message_list.length; i++) {
                let current_message = message_list[i];
                current_message.draw();
                if (current_message.status === "for_delete") {
                    message_list.splice(i, 1);
                }
            }
            paddle.speed = [0, 0]

            context.drawImage(SPIKES, 26, config.CANVAS_HEIGHT - 24);

            requestAnimationFrame(loop);
        }
    }
}

function arkanoid_start(lvl) {
    lvl_ended = false;
    $("#arkanoid").focus();
    disable_keys();
    $('#top-scores').css({"opacity": "0"});
    $('#add-score-container').css({"opacity": "0"});
    $('#start').attr("disabled", true);
    $('#show-score').attr("disabled", true);
    if (lvl % 5 === 0) {
        cyberdemon = new Cyberdemon(lvl);
        bricks.push(new InvulnerableBrick(context, "invulnerable", config.CANVAS_HEIGHT / 2, config.CANVAS_WIDTH / 2));
        message_list.push(new Message(context, "Level " + lvl));
        play_audio(start_sound);
        start_animation(config.fps);
    } else {
        $.ajax({
            url: "/generate_arkanoid_lvl",
            async: false,
            type: "GET",
            contentType: "application/json",
            data: {"lvl": lvl},
            success: function (data) {
                bricks = create_bricks(data["bricks"]);
                bonuses = create_bonuses(data["bonuses"]);
                enemies = create_enemies(data["enemies"]);
                message_list.push(new Message(context, "Level " + lvl));
                play_audio(start_sound);
                start_animation(config.FPS);
            }
        });
    }
}

function random_bonus_generation() {
    if (!ball.onPaddle) {
        bonus_delay -= Math.random();
    }
    if (bonus_delay < 0) {
        bonus_delay = config.BONUS_DELAY;
        let seed = Math.random();
        let x = Math.floor(Math.random() * (config.CANVAS_WIDTH - 80));
        play_audio(start_sound);

        if (seed > 0.95) {
            bonuses.push(new LifeBonus(context, "life", x, 0));
        } else if (seed > 0.8) {
            bonuses.push(new InvisibilityBonus(context, "invisibility", x, 0));
        } else if (seed > 0.7) {
            bonuses.push(new MegaBonus(context, "mega", x, 0));
        } else if (seed > 0.6) {
            bonuses.push(new SpeedBonus(context, "speed", x, 0));
        } else if (seed > 0.4) {
            bonuses.push(new InvulnerabilityBonus(context, "invulnerability", x, 0));
        } else if (seed > 0.2) {
            bonuses.push(new HpBonus(context, "hp", x, 0));
        } else {
            bonuses.push(new Barrel(context, "barrel", x, 0));
        }
    }
}

function create_bricks(bricks_list) {
    let bricks = [];
    for (let i = 0; i < bricks_list.length; i++) {
        let brick = bricks_list[i];
        let current_brick;
        if (brick["type"] === "brown") {
            current_brick = new BrownBrick(context, brick["type"], brick["x"], brick["y"]);
        }
        if (brick["type"] === "default") {
            current_brick = new DefaultBrick(context, brick["type"], brick["x"], brick["y"]);
        }
        if (brick["type"] === "grey") {
            current_brick = new GreyBrick(context, brick["type"], brick["x"], brick["y"]);
        }
        bricks.push(current_brick);
    }
    return bricks;
}

function create_bonuses(bonuses_list) {
    let bonuses = [];
    let current_bonus;
    for (let i = 0; i < bonuses_list.length; i++) {
        let bonus = bonuses_list[i];
        let random_x = Math.floor(Math.random() * 61 - 30);
        if (bonus["type"] === "life") {
            current_bonus = new LifeBonus(context, bonus["type"], bonus["x"] + random_x, bonus["y"])
        }
        if (bonus["type"] === "invisibility") {
            current_bonus = new InvisibilityBonus(context, bonus["type"], bonus["x"] + random_x, bonus["y"])
        }
        if (bonus["type"] === "mega") {
            current_bonus = new MegaBonus(context, bonus["type"], bonus["x"] + random_x, bonus["y"])
        }
        if (bonus["type"] === "speed") {
            current_bonus = new SpeedBonus(context, bonus["type"], bonus["x"] + random_x, bonus["y"])
        }
        if (bonus["type"] === "invulnerability") {
            current_bonus = new InvulnerabilityBonus(context, bonus["type"], bonus["x"] + random_x, bonus["y"])
        }
        if (bonus["type"] === "hp") {
            current_bonus = new HpBonus(context, bonus["type"], bonus["x"] + random_x, bonus["y"])
        }
        if (bonus["type"] === "barrel") {
            current_bonus = new Barrel(context, bonus["type"], bonus["x"] + random_x, bonus["y"])
        }
        bonuses.push(current_bonus);
    }
    return bonuses;
}

function create_enemies(enemies_list) {
    let enemies = [];
    let current_enemy;
    for (let i = 0; i < enemies_list.length; i++) {
        let random_x = Math.floor(Math.random() * 41 - 20);
        let enemy = enemies_list[i];
        if (enemy["type"] === "doomguy") {
            current_enemy = new Doomguy(context, enemy["type"], enemy["x"] + random_x, enemy["y"]);
        }
        if (enemy["type"] === "imp") {
            current_enemy = new Imp(context, enemy["type"], enemy["x"] + random_x, enemy["y"]);
        }
        if (enemy["type"] === "baron") {
            current_enemy = new Baron(context, enemy["type"], enemy["x"] + random_x, enemy["y"]);
        }
        if (enemy["type"] === "arachnotron") {
            current_enemy = new Arachnotron(context, enemy["type"], enemy["x"], enemy["y"]);
        }
        enemies.push(current_enemy);
    }
    return enemies;
}

function level_complete(current_lvl) {
    reset_loop_vars();
    arkanoid_start(current_lvl);
}

function game_over() {
    lvl_ended = true;
    enable_keys();
    $('#start').attr("disabled", false);
    $('#show-score').attr("disabled", false);
    show_score_form(game_score);

    reset_loop_vars();

    current_lvl = 1;
    game_score = 0;
    lives = config.LIVES;
}

function reset_loop_vars() {
    bricks = [];
    bonuses = [];
    enemies = [];
    score_list = [];
    message_list = [];
    debris_list = [];
    cyberdemon = null;
    projectiles = [];
    lvl_end_timer = 0;
    ball.reset();
    paddle.reset();
}

function draw_hud() {
    context.textAlign = "end";
    context.fillStyle = "#6F6F6F";
    context.font = "24px roboto";
    context.fillText(" Score: " + game_score, 800, 24);
    context.textAlign = "start";
    context.fillText("Lives: " + lives + " Hp: " + ball.hp, 0, 24);
}

function show_message(text) {
    context.textAlign = "center";
    context.fillStyle = "#000000";
    context.font = "24px roboto";
    context.fillText(text, config.CANVAS_WIDTH / 2, config.CANVAS_HEIGHT / 2);
}

function show_score_form(score) {
    last_score = score;
    $("#add-score-container h2").remove();
    $('#add-score-container').css({"opacity": "1"})
    $('#add-score-container').prepend("<h2>Game over</h2><h2>Your score: " + last_score + "</h2>")
}

$('#add-score-form').on('submit', function (event) {
    event.preventDefault();
    let username = $("#add-score-form").serialize().split("=")[1];
    if (username.length === 0) {
        return false;
    } else {
        if (username.length > 30) {
                    let excess_chars = username.length - 30;
                    username = username.substr(0, decoded_user.length - excess_chars);
        }
        current_username = username
        add_score();
    }
});

function add_score() {
    $('#add-score-container').css({"opacity": "0"});
    $("#add-score-form")[0].reset();
    $.ajax({
            url: "/add_score",
            async: false,
            type: "POST",
            data: {"score": last_score, "user": current_username, "date": Date.now()}
        }
    );
    show_user_result();
}

async function show_score() {
    let score_table_container = $('#top-scores');
    if (score_table_container.css("opacity") === "0") {
        $('#add-score-container').css({"opacity": "0"});
        let data = await get_score_results(current_score_page);
        if (data) {
            check_prev_and_next(data.has_prev, data.has_next);
            score_table_container.css({"opacity": "1"});
            create_table(data.page_rows, last_score, current_username);
        }
    } else {
        score_table_container.css({"opacity": "0"});
    }
}

async function get_score_results(page_index) {
    let response = await fetch('/show_score_page?' + `page_index=${page_index}`);
    if (response.ok) {
        return await response.json();
    }
}

function prev_page() {
    let score_table_container = $('#top-scores');
    current_score_page -= 1;
    score_table_container.css({"opacity": "0"});
    setTimeout(show_score, 1050);
}

function next_page() {
    let score_table_container = $('#top-scores');
    current_score_page += 1;
    score_table_container.css({"opacity": "0"});
    setTimeout(show_score, 1050);
}

function check_prev_and_next(has_prev, has_next) {
    let prev_page_btn = $('#prev_page_btn');
    let next_page_btn = $('#next_page_btn');

    has_prev ? prev_page_btn.prop('disabled', false) : prev_page_btn.prop('disabled', true);
    has_next ? next_page_btn.prop('disabled', false) : next_page_btn.prop('disabled', true);
}

function show_user_result() {
    let score_table_container = $('#top-scores');
    $('#add-score-container').css({"opacity": "0"});
    $.ajax({
        url: "/show_user_result",
        type: "GET",
        data: {
            username: current_username,
            score: last_score
        },
        success: function (data) {
            check_prev_and_next(data.has_prev, data.has_next);
            score_table_container.css({"opacity": "1"});
            create_table(data['page_rows'], last_score, current_username);
            current_score_page = data['page_index']
        }
    });
}

function create_table(data, score, username) {
    let score_table = $('#top-scores-table');
    let current_user_shown = false;
    let rows_count = data.length;
    $("tr", score_table).remove();
    score_table.append("<tr><th width='10%'>№</th><th width='50%'>Name</th><th width='20%'>Score</th><th width='10%'>Date</th></tr>")
    for (let i = 0; i < rows_count; i++) {
        if ((score === data[i]["score"]) && (username === data[i]["username"]) && (!current_user_shown)) {
            current_user_shown = true;
            score_table.append("<tr style='color: black'></tr>");
            add_row(score_table, data, i)
        } else {
            score_table.append("<tr></tr>");
            add_row(score_table, data, i)
        }
    }
}

function add_row(score_table, data, row_number) {
    $("tr:last", score_table).append(
        "<td>" + (data[row_number]["number"]) + "</td>"
        + "<td>" + data[row_number]["username"] + "</td>"
        + "<td>" + data[row_number]["score"] + "</td>"
        + "<td>" + data[row_number]["date"] + "</td>");
}

function fps_switch() {
    $("#arkanoid").focus();
    fps_enable = !fps_enable;
}

function show_fps() {
    let currentFPS = Math.round(1000 / (this_loop - last_loop));
    context.textAlign = "center";
    context.fillStyle = "#6F6F6F";
    context.font = "24px roboto";
    context.fillText("FPS: " + currentFPS, 400, 24);
}

function pause() {
    $("#arkanoid").focus();
    if (stopped) {
        stopped = false;
        start_animation(config.FPS);
    } else {
        stopped = true;
    }
}

function disable_keys() {
    document.onkeydown = function (e) {
        return false;
    }
}

function enable_keys() {
    document.onkeydown = function (e) {
        return true;
    }
}

function mute() {
    muted = !muted;
}

