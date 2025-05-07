import { Scene } from 'phaser';

const WIDTH = 1024;
const HEIGHT = 768;

export class Game extends Scene {
    constructor() {
        super('Game');
        this.player = null;

        let player;
        let ground;
        let clouds;
    }

    preload() {
        // load assets
        this.load.spritesheet("dino","assets/dino-run.png", {frameWidth: 88, frameHeight: 94});
        this.load.image("ground", "assets/ground.png");
        this.load.image("cloud", "assets/cloud.png");
        this.load.image("game-over", "assets/game-over.png");
        this.load.image("restart", "assets/restart.png");
        this.load.image("dino-hurt", "assets/dino-hurt.png");

        // load cactuses (different type)
        for (let i=0; i<6; i++) {
            const cactusNum = i+1;
            // console.log(`cactus${cactusNum}`)
            this.load.image(`obstacle-${cactusNum}`, `assets/cactuses_${cactusNum}.png`);
        }
    }

    create() {
        this.isGameRunning = true;
        this.gameSpeed = 10;
        this.timer = 0;
        this.score = 0;
        this.frameCounter = 0;
        

        // initialize game
        this.player = this.physics.add.sprite(200, 200, "dino").setDepth(1).setOrigin(0).setGravityY(5000).setCollideWorldBounds(true).setBodySize(44,92);
        this.ground = this.add.tileSprite(0, 400, 1000, 30, "ground").setOrigin(0);
        this.scoreText = this.add.text(700, 50, "Score: 0", {
            fontSize: 30,
            fontFamily: "Arial",
            color: "#535353",
            resolution: 5
        }).setOrigin(1,0);

        // add cloud images
        this.clouds = this.add.group()
        this.clouds = this.clouds.addMultiple([
            this.add.image(300, 100, "cloud"),
            this.add.image(400, 120, "cloud"),
            this.add.image(550, 70, "cloud"),
            this.add.image(150, 70, "cloud"),
        ])

        this.gameOverText = this.add.image(0, 0, "game-over")
        this.restartText = this.add.image(0, 80, "restart").setInteractive();
        
        this.gameOverContainer = this.add
        .container(1000 / 2, (300 / 2) - 50)
        .add([this.gameOverText, this.restartText]) 
        .setAlpha(0);

        // add ground collide
        this.groundCollider = this.physics.add.staticSprite(0,425, "ground").setOrigin(0);
        this.groundCollider.body.setSize(1000, 30);
        this.groundCollider.setVisible(false);  // hide the static ground 

        this.physics.add.collider(this.player, this.groundCollider);

        this.obstacles = this.physics.add.group({
            allowGravity: false, //no gravity for cactuses
        })

        this.cursors = this.input.keyboard.createCursorKeys();
        
        this.physics.add.collider(this.obstacles, this.player, this.gameOver, null, this);
    
        // display high score
        this.highScore = 0;
        this.highScoreText = this.add.text(500, 100, "High Score: 00000", {
            fontSize: 30,
            fontFamily: "Arial",
            color: "#535353",
            resolution: 5
        }).setOrigin(0,0).setAlpha(1);

        //optional congrats message
        this.congratsText = this.add.text(100, 100, "Congrats! A new high score!", {
            fontSize: 30,
            fontFamily: "Arial",
            color: "#535353",
            resolution: 5
        }).setOrigin(0,0).setAlpha(0); // alpha 0 means invisible
    }

    update(time, delta) {
        if(!this.isGameRunning) {return;}

        this.frameCounter++;
        if (this.frameCounter > 100) {
            this.score += 100;
            const formattedScore = String(Math.floor(this.score));
            this.scoreText.setText(formattedScore)
            this.frameCounter -= 100;
        }
        
        const { space, up} = this.cursors;

        if ((Phaser.Input.Keyboard.JustDown(space)
            || Phaser.Input.Keyboard.JustDown(up)) 
            && this.player.body.onFloor()) {
            this.player.setVelocityY(-1600);
        }

        // game logic
        this.ground.tilePositionX += this.gameSpeed;
        this.timer += delta;
        
        //generate a number in range 1~6
        if (this.timer > 1000) {
            this.obstacleNum = Math.floor(Math.random() * 6) +1;
            this.obstacles.create(750,315, `obstacle-${this.obstacleNum}`).setOrigin(0);
            this.timer -= 1000;
        }

        Phaser.Actions.IncX(this.obstacles.getChildren(), -this.gameSpeed);

        this.obstacles.getChildren().forEach(obstacle => {
            if (obstacle.getBounds().right < 0) {
                this.obstacles.remove(obstacle);
                obstacle.destroy();
                }   
        })
        

        this.restartText.on('pointerdown', () => {
            this.physics.resume();
            this.player.setVelocityY(0);
            this.obstacles.clear(true, true);
            this.gameOverContainer.setAlpha(0);
            this.congratsText.setAlpha(0);
            this.frameCounter = 0;
            this.score = 0;
            const formattedScore = String(Math.floor(this.score)).padStart(5, "0");
            this.scoreText.setText(formattedScore);
            this.isGameRunning = true;
        })

        this.anims.create({
            key: "dino-run",
            frames: this.anims.generateFrameNumbers("dino", {start: 2, end: 3}),
            frameRate: 10,
            repeat: -1
        });

        this.player.play("dino-run", true);

        if (this.player.body.deltaAbsY() > 4) {
            this.player.anims.stop();
            this.player.setTexture("dino", 0);
        } else {
            this.player.play("dino-run", true);
        }
    }
    gameOver() {
        // check to see if high score
        if (this.score > this.highScore) {
            //update high score variable
            this.highScore = this.score;

            //update high score text
            this.highScoreText.setText(`High Score: ${String(Math.floor(this.highScore)).padStart(5, "0")}`);
            
            //show congrats
            this.congratsText.setAlpha(1);
        }
        this.physics.pause();
        this.timer = 0;
        this.isGameRunning = false;
        this.gameOverContainer.setAlpha(1);
        this.anims.pauseAll();
        this.anims.resumeAll();
        this.player.setTexture("dino-hurt");


    }

}
