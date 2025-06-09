import { _decorator, Component, Node, Label, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

const GAME_TIME = 5; // 定义全局游戏时间，单位为秒，测试版用5秒，正式版60秒吧

// 垃圾类型枚举
enum RubbishType {
    Recyclable, // 可回收物
    Kitchen,    // 厨余垃圾
    Other,      // 其他垃圾
    Harmful     // 有害垃圾
}

@ccclass('GameManager')
export class GameManager extends Component {

    @property({ type: Node })
    public mainMenu: Node = null;

    @property({ type: Node })
    public gamePlay: Node = null;

    @property({ type: Node })
    public timeOver: Node = null;

    @property({ type: Label })
    public countDownLabel: Label = null;

    @property({ type: Label })
    public gameScoreLabel: Label = null;

    @property({ type: Label })
    public finalGameScoreLabel: Label = null;

    @property({ type: [Node] })
    public Bins: Node[] = [];  // 存储4个垃圾箱节点

    @property({ type: [Node] })
    public BinPos: Node[] = []; // 存储4个垃圾箱节点的初始坐标节点

    // 一局游戏的时间，单位为秒
    private _countDownTime: number = GAME_TIME;
    private _isCounting: boolean = false;
    private _gameScore: number = 0;

    // 垃圾箱类型数组
    private _binTypes: RubbishType[] = [];

    start() {
        // 初始时隐藏GamePlay、TimeOver
        this.mainMenu.active = true;
        this.gamePlay.active = false;
        this.timeOver.active = false;

        // 初始化垃圾箱类型
        this.initBinTypes();

        // 初始化垃圾箱位置
        this.initBinsPosition();
    }

    update(deltaTime: number) {
        if (this._isCounting) {
            this._countDownTime -= deltaTime;
            if (this._countDownTime <= 0) {
                this._countDownTime = 0;
                this._isCounting = false;
                this.onTimeOver();
            }
            this.countDownLabel.string = Math.ceil(this._countDownTime).toString();
        }
    }

    // 点击开始游戏按钮的处理函数
    public onStartGameButtonClicked() {
        // 隐藏MainMenu
        this.mainMenu.active = false;

        // 显示GamePlay
        this.gamePlay.active = true;

        // 初始化新的一局数据
        this.initGameData();
    }

    // 点击再来一局按钮的处理函数
    public onPlayAgainButtonClicked() {
        // 隐藏TimeOver
        this.timeOver.active = false;

        // 显示GamePlay
        this.gamePlay.active = true;

        // 初始化新的一局数据
        this.initGameData();
    }

    // 初始化每局数据
    private initGameData() {
        // 初始化分数
        this._gameScore = 0;
        this.updateScoreLabel();
        // 初始化倒计时
        this._countDownTime = GAME_TIME;
        this.countDownLabel.string = this._countDownTime.toString();
        this._isCounting = true;

        // 重新初始化垃圾箱位置
        this.initBinsPosition();
    }

    // 初始化垃圾箱类型
    private initBinTypes() {
        this._binTypes = [
            RubbishType.Recyclable,
            RubbishType.Kitchen,
            RubbishType.Other,
            RubbishType.Harmful
        ];
    }

    // 初始化垃圾箱位置
    private initBinsPosition() {
        // 按照垃圾类型排序
        this.sortBinsByType();

        for (let i = 0; i < this.Bins.length; i++) {
            this.Bins[i].setPosition(this.BinPos[i].position.x, this.BinPos[i].position.y, 0);
        }
    }

    // 按照垃圾类型给垃圾箱排序
    private sortBinsByType() {
        // 使用冒泡排序，根据垃圾类型进行排序
        for (let i = 0; i < this.Bins.length - 1; i++) {
            for (let j = 0; j < this.Bins.length - i - 1; j++) {
                if (this._binTypes[j] > this._binTypes[j + 1]) {
                    // 交换垃圾箱类型
                    let tempType = this._binTypes[j];
                    this._binTypes[j] = this._binTypes[j + 1];
                    this._binTypes[j + 1] = tempType;

                    // 交换垃圾箱节点
                    let tempBin = this.Bins[j];
                    this.Bins[j] = this.Bins[j + 1];
                    this.Bins[j + 1] = tempBin;
                }
            }
        }
    }

    // 时间结束的处理函数
    private onTimeOver() {
        // 隐藏GamePlay
        this.gamePlay.active = false;

        // 显示TimeOver、最终分数
        this.timeOver.active = true;
        this.finalGameScoreLabel.string = this._gameScore.toString();
    }
    // 加3分
    public addScore() {
        this._gameScore += 3;
        this.updateScoreLabel();
    }
    // 扣1分
    public deductScore() {
        this._gameScore -= 1;
        this.updateScoreLabel();
    }
    // 更新分数Label显示
    private updateScoreLabel() {
        this.gameScoreLabel.string = this._gameScore.toString();
    }

    // 点击左边按钮
    public onLeftButtonClicked() {
        this.swapBins(0, 1);
    }

    // 点击中间按钮
    public onMiddleButtonClicked() {
        this.swapBins(1, 2);
    }

    // 点击右边按钮
    public onRightButtonClicked() {
        this.swapBins(2, 3);
    }

    // 交换垃圾箱
    private swapBins(index1: number, index2: number) {
        // 交换垃圾箱类型
        let tempType = this._binTypes[index1];
        this._binTypes[index1] = this._binTypes[index2];
        this._binTypes[index2] = tempType;

        // 交换节点
        let temp = this.Bins[index1];
        this.Bins[index1] = this.Bins[index2];
        this.Bins[index2] = temp;

        // 交换位置
        this.Bins[index1].setPosition(this.BinPos[index1].position.x, this.BinPos[index1].position.y, 0);
        this.Bins[index2].setPosition(this.BinPos[index2].position.x, this.BinPos[index2].position.y, 0);
    }
}