import { _decorator, Component, Node, Label, Prefab, instantiate, Sprite, SpriteFrame, Color, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

const GAME_TIME = 30; // 定义全局游戏时间，单位为秒，测试版用30秒，正式版60秒吧
const RUBBISH_DROP_SPEED = -200; // 定义垃圾掉落速度，单位：像素/秒

// 垃圾类型枚举
enum RubbishType {
    Recyclable, // 可回收物
    Kitchen,    // 厨余垃圾
    Other,      // 其他垃圾
    Harmful     // 有害垃圾
}

// 垃圾数据结构
interface RubbishData {
    type: RubbishType; // 垃圾类型
    name: string; // 垃圾名称
    icon: SpriteFrame; // 垃圾图标
    color: Color; // 垃圾颜色
}

@ccclass('GameManager')
export class GameManager extends Component {

    @property({ type: Node })
    public mainMenu: Node = null; // 主菜单节点

    @property({ type: Node })
    public gamePlay: Node = null; // 游戏主界面节点

    @property({ type: Node })
    public timeOver: Node = null; // 时间结束界面节点

    @property({ type: Label })
    public countDownLabel: Label = null; // 倒计时标签

    @property({ type: Label })
    public gameScoreLabel: Label = null; // 游戏分数标签

    @property({ type: Label })
    public finalGameScoreLabel: Label = null; // 最终游戏分数标签

    @property({ type: [Node] })
    public Bins: Node[] = [];  // 存储4个垃圾箱节点

    @property({ type: [Node] })
    public BinPos: Node[] = []; // 存储4个垃圾箱节点的初始坐标节点

    @property({ type: [Node] })
    public RubbishOriPos: Node[] = []; // 存储垃圾生成点的坐标节点

    @property({ type: Prefab })
    public RubbishPrefab: Prefab = null; // 存储 Rubbish 预制体

    @property({ type: [SpriteFrame] })
    public RubbishIcons: SpriteFrame[] = []; // 存储垃圾图标

    // 一局游戏的时间，单位为秒
    private _countDownTime: number = GAME_TIME;
    private _isCounting: boolean = false; // 是否正在倒计时
    private _gameScore: number = 0; // 游戏分数

    // 垃圾箱类型数组
    private _binTypes: RubbishType[] = [];

    // 缓存 RubbishOriPos 数组的长度
    private _rubbishOriPosLength: number = 4;

    // 存储当前场景中所有的垃圾节点
    private _rubbishNodes: Node[] = [];

    // 垃圾数据
    private _rubbishData: RubbishData[] = [];

    start() {
        // 初始时隐藏GamePlay、TimeOver
        this.mainMenu.active = true;
        this.gamePlay.active = false;
        this.timeOver.active = false;

        // 初始化垃圾箱类型
        this.initBinTypes();

        // 初始化垃圾箱位置
        this.initBinsPosition();

        // 初始化 _rubbishOriPosLength
        this._rubbishOriPosLength = this.RubbishOriPos.length;

        // 初始化垃圾数据
        this.initRubbishData();

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

        // 更新所有垃圾的位置
        this.updateRubbishPositions(deltaTime);
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

        // 移除所有垃圾
        this.removeAllRubbish();
    }

    // 初始化垃圾箱类型
    private initBinTypes() {
        this._binTypes = [
            RubbishType.Recyclable, // 可回收物
            RubbishType.Kitchen, // 厨余垃圾
            RubbishType.Other, // 其他垃圾
            RubbishType.Harmful // 有害垃圾
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

    /**
     * 从 RubbishOriPos 数组中随机抽取一个节点
     * 优化版本：缓存数组长度，使用更快的随机数生成方式
     * @returns {Node | null} 随机抽取的节点，如果数组为空则返回 null
     */
    private getRandomRubbishOriginPosition(): Node | null {
        if (this._rubbishOriPosLength === 0) {
            return null; // 数组为空，返回 null
        }
        // 使用 Math.random() 生成 0 到 3 的随机整数
        const randomIndex = Math.floor(Math.random() * this._rubbishOriPosLength);
        return this.RubbishOriPos[randomIndex];
    }

    // 点击生成垃圾按钮
    public onGenerateRubbishButtonClicked() {
        if (this._isCounting) { // 确保在倒计时期间才能生成垃圾
            this.generateRubbish();
        }
    }

    // 初始化垃圾数据
    private initRubbishData() {
        this._rubbishData = [
            { type: RubbishType.Recyclable, name: "旧书", icon: this.RubbishIcons[0], color: new Color(77, 142, 247) }, // 颜色4D8EF7，可回收物
            { type: RubbishType.Recyclable, name: "塑料瓶", icon: this.RubbishIcons[1], color: new Color(77, 142, 247) }, // 颜色4D8EF7，可回收物
            { type: RubbishType.Recyclable, name: "玻璃杯", icon: this.RubbishIcons[2], color: new Color(77, 142, 247) }, // 颜色4D8EF7，可回收物

            { type: RubbishType.Kitchen, name: "果皮", icon: this.RubbishIcons[3], color: new Color(38, 192, 141) }, // 颜色26C08D，厨余垃圾
            { type: RubbishType.Kitchen, name: "菜叶", icon: this.RubbishIcons[4], color: new Color(38, 192, 141) }, // 颜色26C08D，厨余垃圾
            { type: RubbishType.Kitchen, name: "蛋壳", icon: this.RubbishIcons[5], color: new Color(38, 192, 141) }, // 颜色26C08D，厨余垃圾

            { type: RubbishType.Other, name: "脏的纸", icon: this.RubbishIcons[6], color: new Color(165, 172, 183) }, // 颜色A5ACB7，其他垃圾
            { type: RubbishType.Other, name: "一次性杯", icon: this.RubbishIcons[7], color: new Color(165, 172, 183) }, // 颜色A5ACB7，其他垃圾
            { type: RubbishType.Other, name: "旧胶带", icon: this.RubbishIcons[8], color: new Color(165, 172, 183) }, // 颜色A5ACB7，其他垃圾

            { type: RubbishType.Harmful, name: "旧电池", icon: this.RubbishIcons[9], color: new Color(240, 86, 86) }, // 颜色F05656，有害垃圾
            { type: RubbishType.Harmful, name: "过期药品", icon: this.RubbishIcons[10], color: new Color(240, 86, 86) }, // 颜色F05656，有害垃圾
            { type: RubbishType.Harmful, name: "旧灯泡", icon: this.RubbishIcons[11], color: new Color(240, 86, 86) }  // 颜色F05656，有害垃圾
        ];
    }

    // 生成垃圾
    private generateRubbish() {
        if (this.RubbishPrefab) {
            // 随机选择一个垃圾数据
            const randomIndex = Math.floor(Math.random() * this._rubbishData.length);
            const rubbishData = this._rubbishData[randomIndex];

            // 实例化垃圾预制体
            const newRubbish = instantiate(this.RubbishPrefab);

            // 设置垃圾的父节点为 GamePlay 节点
            newRubbish.setParent(this.gamePlay);

            // 设置垃圾的初始位置
            const randomPositionNode = this.getRandomRubbishOriginPosition();
            if (randomPositionNode) {
                newRubbish.setPosition(randomPositionNode.position.x, randomPositionNode.position.y, 0);
            } else {
                newRubbish.setPosition(0, 0, 0); // 默认位置
            }

            // 设置垃圾的名称
            const nameLabel = newRubbish.getChildByName("labelName").getComponent(Label);
            nameLabel.string = rubbishData.name;

            // 设置垃圾的图标
            const iconSprite = newRubbish.getChildByName("spriteIcon").getComponent(Sprite);
            iconSprite.spriteFrame = rubbishData.icon;

            // 设置垃圾的颜色
            const colorSprite = newRubbish.getChildByName("spriteColor").getComponent(Sprite);
            colorSprite.color = rubbishData.color;

            // 将垃圾类型存储到垃圾节点的用户数据中
            // 由于 Node 上不存在 setUserData 方法，使用自定义属性存储垃圾类型
            newRubbish["_customRubbishType"] = rubbishData.type;

            // 将垃圾节点添加到数组中
            this._rubbishNodes.push(newRubbish);
        } else {
            console.warn("Rubbish Prefab 未设置！");
        }
    }

    // 更新所有垃圾的位置
    private updateRubbishPositions(deltaTime: number) {
        for (let i = 0; i < this._rubbishNodes.length; i++) {
            const rubbishNode = this._rubbishNodes[i];
            if (rubbishNode) {
                // 计算新的 Y 坐标
                const newY = rubbishNode.position.y + RUBBISH_DROP_SPEED * deltaTime;

                // 更新垃圾的位置
                rubbishNode.setPosition(rubbishNode.position.x, newY, 0);

                // 检查是否低于垃圾桶的位置
                if (rubbishNode.position.y < this.BinPos[0].position.y) {
                    // 检查垃圾的 X 坐标是否与垃圾桶的 X 坐标相同
                    for (let j = 0; j < this.Bins.length; j++) {
                        // 使用近似相等判断，允许一定误差
                        if (Math.abs(rubbishNode.position.x - this.Bins[j].position.x) < 10) {
                            // 获取垃圾的类型
                            const rubbishType = rubbishNode["_customRubbishType"] as RubbishType;

                            // 检查垃圾的类型是否与对应垃圾桶的类型相同
                            if (rubbishType === this._binTypes[j]) {
                                this.addScore(); // 加 3 分
                            } else {
                                this.deductScore(); // 扣 1 分
                            }
                            break; // 找到匹配的垃圾桶后，跳出循环
                        }
                    }

                    // 移除垃圾
                    rubbishNode.destroy();
                    this._rubbishNodes.splice(i, 1);
                    i--; // 调整索引，避免跳过下一个垃圾
                }
            } else {
                // 如果垃圾节点为空，从数组中移除
                this._rubbishNodes.splice(i, 1);
                i--;
            }
        }
    }

    // 移除所有垃圾
    private removeAllRubbish() {
        for (let i = 0; i < this._rubbishNodes.length; i++) {
            const rubbishNode = this._rubbishNodes[i];
            if (rubbishNode) {
                rubbishNode.destroy();
            }
        }
        this._rubbishNodes = [];
    }
}