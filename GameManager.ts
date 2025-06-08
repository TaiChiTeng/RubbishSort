import { _decorator, Component, Node, Label, director } from 'cc';
const { ccclass, property } = _decorator;

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

    // 一局游戏的时间，单位为秒，临时用3秒测试，后续改用60秒
    private _countDownTime: number = 3;
    private _isCounting: boolean = false;
    private _gameScore: number = 0;

    start() {
        // 初始时隐藏GamePlay、TimeOver
        this.mainMenu.active = true;
        this.gamePlay.active = false;
        this.timeOver.active = false;
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
        // 初始化倒计时
        this._countDownTime = 10;
        this.countDownLabel.string = this._countDownTime.toString();
        this._isCounting = true;
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
}