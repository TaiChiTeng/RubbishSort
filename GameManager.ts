import { _decorator, Component, Node, Label, Button, Prefab, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property({ type: Label })
    timerLabel: Label = null;

    @property({ type: Label })
    scoreLabel: Label = null;

    @property({ type: Button })
    startBtn: Button = null;

    @property({ type: Node })
    gameOverModal: Node = null;

    @property({ type: Label })
    finalScoreLabel: Label = null;

    @property({ type: Button })
    playAgainBtn: Button = null;

    @property({ type: Node })
    bucketsContainer: Node = null;

    @property({ type: Button })
    btnLeft: Button = null;

    @property({ type: Button })
    btnMiddle: Button = null;

    @property({ type: Button })
    btnRight: Button = null;

    @property({ type: Prefab })
    trashPrefab: Prefab = null;

    @property({ type: Node })
    gameArea: Node = null;

    @property({
        type: Object,
        default: {
            timer: 60,
            score: 0,
            isPlaying: false,
            trashTypes: [
                { name: '旧书', type: 'recyclable', icon: 'tex_rubbish_oldbook' },
                { name: '塑料瓶', type: 'recyclable', icon: 'tex_rubbish_plasticBottle' },
                { name: '玻璃杯', type: 'recyclable', icon: 'tex_rubbish_glassCup' },
                { name: '果皮', type: 'kitchen', icon: 'tex_rubbish_fruitCore' },
                { name: '菜叶', type: 'kitchen', icon: 'tex_rubbish_vegetableLeaf' },
                { name: '蛋壳', type: 'kitchen', icon: 'tex_rubbish_eggShell' },
                { name: '旧电池', type: 'hazardous', icon: 'tex_rubbish_oldBattery' },
                { name: '旧灯泡', type: 'hazardous', icon: 'tex_rubbish_oldBulb' },
                { name: '过期药品', type: 'hazardous', icon: 'tex_rubbish_oldPill' },
                { name: '脏的纸', type: 'other', icon: 'tex_rubbish_dirtyPaper' },
                { name: '一次性杯', type: 'other', icon: 'tex_rubbish_disposableCup' },
                { name: '旧胶带', type: 'other', icon: 'tex_rubbish_oldTape' }
            ],
            bucketTypes: ['recyclable', 'kitchen', 'other', 'hazardous']
        }
    })
    gameConfig: any = null; // 使用 any 类型，因为 Cocos Creator 3.8.6 对 JSON 类型的支持可能有限

    private gameInterval: any = null;
    private trashInterval: any = null;

    onLoad() {
        this.resetGame();
        this.startBtn.node.on('click', this.startGame, this);
        this.playAgainBtn.node.on('click', this.playAgain, this);
        this.btnLeft.node.on('click', this.swapBucketsLeft, this);
        this.btnMiddle.node.on('click', this.swapBucketsMiddle, this);
        this.btnRight.node.on('click', this.swapBucketsRight, this);
    }

    startGame() {
        this.resetGame();
        this.gameConfig.isPlaying = true;
        this.startBtn.interactable = false;
        this.startBtn.node.getChildByName('Label').getComponent(Label).string = '游戏进行中';
        this.btnLeft.interactable = true;
        this.btnMiddle.interactable = true;
        this.btnRight.interactable = true;

        this.gameInterval = setInterval(() => {
            this.gameConfig.timer--;
            this.timerLabel.string = this.gameConfig.timer.toString();

            if (this.gameConfig.timer <= 0) {
                this.endGame();
            }
        }, 1000);

        let trashSpeed = 2000;
        this.trashInterval = setInterval(() => {
            this.createTrash();

            if (this.gameConfig.timer % 10 === 0 && this.gameConfig.timer > 0) {
                trashSpeed = Math.max(800, trashSpeed - 200);
                clearInterval(this.trashInterval);
                this.trashInterval = setInterval(() => this.createTrash(), trashSpeed);
            }
        }, trashSpeed);
    }

    resetGame() {
        this.gameConfig.timer = 60;
        this.gameConfig.score = 0;
        this.timerLabel.string = this.gameConfig.timer.toString();
        this.scoreLabel.string = this.gameConfig.score.toString();

        let trashes = this.gameArea.getChildren();
        trashes.forEach(trash => trash.destroy());

        let buckets = this.bucketsContainer.getChildren();
        buckets.forEach((bucket, index) => {
            bucket.getComponent('Bucket').setType(this.gameConfig.bucketTypes[index]);
        });
    }

    createTrash() {
        if (!this.gameConfig.isPlaying) return;

        let randomTrash = this.gameConfig.trashTypes[Math.floor(Math.random() * this.gameConfig.trashTypes.length)];
        let trashNode = cc.instantiate(this.trashPrefab);
        trashNode.getComponent('Trash').init(randomTrash, this);

        let buckets = this.bucketsContainer.getChildren();
        let randomBucketIndex = Math.floor(Math.random() * buckets.length);
        let bucket = buckets[randomBucketIndex];
        let bucketPos = bucket.getPosition();
        let gameAreaPos = this.gameArea.getPosition();

        let leftPos = bucketPos.x - 32;
        trashNode.setPosition(new Vec3(leftPos, this.gameArea.height / 2, 0)); // 使用 Vec3 设置位置

        trashNode.getComponent('Trash').fall();
        this.gameArea.addChild(trashNode);
    }

    endGame() {
        this.gameConfig.isPlaying = false;
        clearInterval(this.gameInterval);
        clearInterval(this.trashInterval);

        this.startBtn.interactable = true;
        this.startBtn.node.getChildByName('Label').getComponent(Label).string = '开始游戏';
        this.btnLeft.interactable = false;
        this.btnMiddle.interactable = false;
        this.btnRight.interactable = false;

        this.finalScoreLabel.string = this.gameConfig.score.toString();
        this.gameOverModal.active = true;
    }

    playAgain() {
        this.gameOverModal.active = false;
        this.startGame();
    }

    swapBucketsLeft() {
        if (this.gameConfig.isPlaying) {
            this.swapBuckets(0, 1);
        }
    }

    swapBucketsMiddle() {
        if (this.gameConfig.isPlaying) {
            this.swapBuckets(1, 2);
        }
    }

    swapBucketsRight() {
        if (this.gameConfig.isPlaying) {
            this.swapBuckets(2, 3);
        }
    }

    swapBuckets(index1, index2) {
        let buckets = this.bucketsContainer.getChildren();
        let bucket1 = buckets[index1].getComponent('Bucket');
        let bucket2 = buckets[index2].getComponent('Bucket');
        let tempType = bucket1.type;

        bucket1.setType(bucket2.type);
        bucket2.setType(tempType);
    }

    updateScore(isCorrect: boolean) {
        if (isCorrect) {
            this.gameConfig.score += 3;
            this.gameConfig.timer += 1;
            this.scoreLabel.string = this.gameConfig.score.toString();
            this.timerLabel.string = this.gameConfig.timer.toString();
            this.playSound('correct');
        } else {
            this.gameConfig.score = Math.max(0, this.gameConfig.score - 1);
            this.gameConfig.timer = Math.max(0, this.gameConfig.timer - 1);
            this.scoreLabel.string = this.gameConfig.score.toString();
            this.timerLabel.string = this.gameConfig.timer.toString();
            this.playSound('wrong');

            if (this.gameConfig.timer <= 0) {
                this.endGame();
            }
        }
    }

    playSound(type: string) {
        console.log(`播放${type}音效`);
    }

    update(deltaTime: number) {
        //  每帧更新的逻辑，目前为空
    }
}