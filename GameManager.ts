import { _decorator, Component, Node, Label, Prefab, instantiate, Sprite, SpriteFrame, Color, Vec3, Tween, tween, easing } from 'cc';
const { ccclass, property } = _decorator;

const GAME_TIME = 60; // 定义全局游戏时间，单位为秒
const RUBBISH_DROP_ACCELERATION = -475; // 定义垃圾掉落加速度，单位：像素/秒^2
const RUBBISH_GENERATE_INTERVAL = 2.85; // 定义垃圾生成间隔，单位为秒
const RUBBISH_SPAWN_ANIMTIME_SCALE_UP = 0.2; // 定义垃圾生成时缩放动画放大时间，单位为秒
const RUBBISH_SPAWN_ANIMTIME_SCALE_DOWN = 0.1; // 定义垃圾生成时缩放动画缩小时间，单位为秒
const STAR_DESTROY_DELAY = 0.8; // 定义星星销毁延迟时间，单位为秒
const START_ANIM_DESTROY_DELAY = 2.5; // 定义游戏开始动画销毁延迟时间，单位为秒

// 困难模式配置
const HARD_MODE_CONFIG = {
    INITIAL_GENERATE_INTERVAL: 2.85, // 初始生成间隔
    GAME_TIME: 60,                // 困难模式时间
};

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
    public ModeNode: Node[] = []; // 存储2个模式节点

    @property({ type: [Node] })
    public Bins: Node[] = [];  // 存储4个垃圾箱节点

    @property({ type: [Node] })
    public BinPos: Node[] = []; // 存储4个垃圾箱节点的初始坐标节点

    @property({ type: [Node] })
    public RubbishOriPos: Node[] = []; // 存储垃圾生成点的坐标节点

    @property({ type: Prefab })
    public RubbishPrefab: Prefab = null; // 存储 Rubbish 预制体

    @property({ type: Prefab })
    public RubbishHardPrefab: Prefab = null; // 存储 RubbishHard 预制体

    @property({ type: [SpriteFrame] })
    public RubbishIcons: SpriteFrame[] = []; // 存储垃圾图标

    @property({ type: Prefab })
    public AddStarPrefab: Prefab = null; // 存储 表现加分星星 预制体

    @property({ type: Prefab })
    public DeductStarPrefab: Prefab = null; // 存储 表现减分星星 预制体

    @property({ type: Prefab })
    public StartAnimPrefab: Prefab = null; // 存储 游戏准备开始动画 预制体

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

    // 游戏难度模式
    private _isHardMode: boolean = false;

    // 新增回调引用
    private _generateRubbishCallback: () => void = null;

    // 连击计数器
    private _comboCount: number = 0;

    // 垃圾生成数量
    private _rubbishGenerateCount = 1;

    // 垃圾箱动画 Tween 对象
    private _binTweens: (Tween<Node> | null)[] = [null, null, null, null];

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

        this._generateRubbishCallback = this.generateRubbish.bind(this);
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
        this._isHardMode = false;
        this.startGame();
    }

    // 点击开始困难模式按钮的处理函数
    public onStartHardModeButtonClicked() {
        this._isHardMode = true;
        this.startGame();
    }

    private startGame() {
        // 隐藏MainMenu
        this.mainMenu.active = false;

        // 显示GamePlay
        this.gamePlay.active = true;

        // 初始化新的一局数据
        this.initGameData();

        // 生成游戏开始动画
        this.spawnStartAnim();
    }

    // 点击再来一局按钮的处理函数
    public onPlayAgainButtonClicked() {
        // 隐藏TimeOver
        this.timeOver.active = false;

        // 显示GamePlay
        this.gamePlay.active = true;

        // 初始化新的一局数据
        this.initGameData();

        // 生成游戏开始动画
        this.spawnStartAnim();
    }

    // 点击回主菜单按钮的处理函数
    public onMainMenuButtonClicked() {
        // 隐藏TimeOver
        this.timeOver.active = false;

        // 显示MainMenu
        this.mainMenu.active = true;
        // 确保返回主菜单时停止生成垃圾
        this.stopGenerateRubbish();
    }

    // 初始化每局数据
    private initGameData() {
        if (this._isHardMode) {
            this.ModeNode[0].active = false; // 隐藏简单模式节点
            this.ModeNode[1].active = true; // 显示困难模式节点
        }else {
            this.ModeNode[0].active = true; // 显示简单模式节点
            this.ModeNode[1].active = false; // 隐藏困难模式节点
        }

        // 初始化分数
        this._gameScore = 0;
        this.updateScoreLabel();

        // 初始化倒计时
        this._countDownTime = this._isHardMode ? HARD_MODE_CONFIG.GAME_TIME : GAME_TIME;
        this.countDownLabel.string = Math.ceil(this._countDownTime).toString();
        this._isCounting = true;

        // 重新初始化垃圾箱位置
        this.initBinsPosition();

        // 移除所有垃圾
        this.removeAllRubbish();

        // 初始化连击计数器和垃圾生成数量
        this._comboCount = 0;
        this._rubbishGenerateCount = 1;

        // 定时生成垃圾
        this.stopGenerateRubbish();
        this.startGenerateRubbish();
    }

    // 启动生成垃圾的定时器
    private startGenerateRubbish() {

        const interval = this._isHardMode
        ? HARD_MODE_CONFIG.INITIAL_GENERATE_INTERVAL
        : RUBBISH_GENERATE_INTERVAL;

      this.schedule(this._generateRubbishCallback, interval);
    }

    // 停止生成垃圾的定时器
    private stopGenerateRubbish() {
        if (this._generateRubbishCallback) {
            this.unschedule(this._generateRubbishCallback);
          }
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

        // 停止生成垃圾
        this.stopGenerateRubbish();
    }
    // 加5分
    public addScore(binIndex: number) {
        this._gameScore += 5;
        this.updateScoreLabel();
        // if (this._isHardMode)this.increaseCombo(); // 增加连击计数  屏蔽了困难模式的连击奖励
        this.playCorrectBinAnimation(this.Bins[binIndex]);  // 播放垃圾桶正确动画
        this.spawnStar(this.Bins[binIndex], this.AddStarPrefab); // 生成加分星星
    }
    // 扣3分
    public deductScore(binIndex: number) {
        this._gameScore -= 3;
        this.updateScoreLabel();
        this.resetCombo(); // 重置连击计数
        this.playWrongBinAnimation(this.Bins[binIndex]); // 播放垃圾桶错误动画
        this.spawnStar(this.Bins[binIndex], this.DeductStarPrefab); // 生成扣分星星
    }
    // 更新分数Label显示
    private updateScoreLabel() {
        if (this.finalGameScoreLabel) {
            this.gameScoreLabel.string = this._gameScore.toString();
        }
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
        // 停止垃圾箱的动画
        this.stopBinAnimation(index1);
        this.stopBinAnimation(index2);

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

    /** 停止垃圾箱动画 */
    private stopBinAnimation(index: number) {
        if (this._binTweens[index]) {
            this._binTweens[index].stop();
            this._binTweens[index] = null;
        }
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

    /**
     * 生成垃圾
     * 确保每次生成的垃圾都是不同种类的
     */
    private generateRubbish() {
        // 根据难度模式选择不同的预制体
        const rubbishPrefab = this._isHardMode ? this.RubbishHardPrefab : this.RubbishPrefab;

        if (rubbishPrefab) {
            // 获取垃圾数据的长度
            const rubbishDataLength = this._rubbishData.length;

            // 如果垃圾生成数量大于垃圾数据的长度，则将垃圾生成数量设置为垃圾数据的长度
            let generateCount = Math.min(this._rubbishGenerateCount, rubbishDataLength);

            // 简单模式限制最大垃圾生成数量为 3
            if (!this._isHardMode) {
                generateCount = Math.min(generateCount, 3);
            }

            // 创建一个数组，用于存储已经选择的垃圾类型
            const selectedTypes: RubbishType[] = [];

            // 获取 RubbishType 的所有值
            const rubbishTypeValues: RubbishType[] = Object.keys(RubbishType)
                .filter(key => isNaN(Number(key))) // 过滤掉数字类型的 key
                .map(key => RubbishType[key]);

            // 循环生成垃圾
            while (selectedTypes.length < generateCount) {
                // 随机选择一个垃圾类型
                const typeIndex = Math.floor(Math.random() * rubbishTypeValues.length);
                const type = rubbishTypeValues[typeIndex];

                // 确保每次生成的垃圾都是不同种类的
                if (selectedTypes.indexOf(type) === -1) {
                    selectedTypes.push(type);
                }
            }

            // 根据选择的垃圾类型创建垃圾
            for (let i = 0; i < selectedTypes.length; i++) {
                const type = selectedTypes[i];
                // 根据垃圾类型找到对应的垃圾数据
                const rubbishData = this._rubbishData.find(data => data.type === type);
                if (rubbishData) {
                    this.createSingleRubbish(rubbishData, rubbishPrefab); // 传入预制体
                }
            }
        } else {
            console.warn("Rubbish Prefab 未设置！");
        }
    }

    /**
     * 创建单个垃圾
     * @param rubbishData 垃圾数据
     * @param rubbishPrefab 垃圾预制体
     */
    private createSingleRubbish(rubbishData: RubbishData, rubbishPrefab: Prefab) {
        // 实例化垃圾预制体
        const newRubbish = instantiate(rubbishPrefab);

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

        // 初始状态设置为停留
        newRubbish["_isWaiting"] = true;

        // 将垃圾节点添加到数组中
        this._rubbishNodes.push(newRubbish);

        // 初始化垃圾的垂直速度
        newRubbish["_verticalSpeed"] = 0;

        // 缩放动画
        newRubbish.setScale(new Vec3(0.5, 0.5, 0.5)); // 初始缩放为0.5

        tween(newRubbish)
            .to(RUBBISH_SPAWN_ANIMTIME_SCALE_UP, { scale: new Vec3(1.1, 1.1, 1) }, { easing: easing.quadOut }) // 放大到1.1倍
            .to(RUBBISH_SPAWN_ANIMTIME_SCALE_DOWN, { scale: new Vec3(1, 1, 1) }, { easing: easing.quadIn }) // 缩小到正常大小
            .call(() => {
                newRubbish["_isWaiting"] = false; // 动画结束后，开始掉落
            })
            .start();
    }

    // 更新所有垃圾的位置
    private updateRubbishPositions(deltaTime: number) {
        for (let i = 0; i < this._rubbishNodes.length; i++) {
            const rubbishNode = this._rubbishNodes[i];
            if (rubbishNode) {
                if (rubbishNode["_isWaiting"]) {
                    // 如果垃圾正在等待，则不更新位置
                    continue;
                }

                // 获取垃圾当前的垂直速度
                let verticalSpeed = rubbishNode["_verticalSpeed"] || 0;

                // 计算新的垂直速度（加速度为每秒 -100）
                verticalSpeed += RUBBISH_DROP_ACCELERATION * deltaTime;

                // 更新垃圾的垂直速度
                rubbishNode["_verticalSpeed"] = verticalSpeed;

                // 计算新的 Y 坐标
                const newY = rubbishNode.position.y + verticalSpeed * deltaTime;

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
                                this.addScore(j); // 加 3 分,传入垃圾桶的index
                            } else {
                                this.deductScore(j); // 扣 1 分，传入垃圾桶的index
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

    // 增加连击计数
    private increaseCombo() {
      //  if (this._isHardMode){
      //       this._comboCount++;
      //        // 困难模式：正确连击5次后，每次生成2个垃圾
      //       if (this._comboCount >= 5 && this._comboCount < 10) {
      //           this._rubbishGenerateCount = 2;
      //       }
      //       // 困难模式：正确连击10次后，每次生成3个垃圾
      //       else if (this._comboCount >= 10 && this._comboCount < 20) {
      //           this._rubbishGenerateCount = 3;
      //       }
      //        // 困难模式：正确连击20次后，每次生成4个垃圾
      //       else if (this._comboCount >= 20) {
      //           this._rubbishGenerateCount = 4;
      //       }
      // }
    }

    // 重置连击计数
    private resetCombo() {
        this._comboCount = 0;
        this._rubbishGenerateCount = 1; // 重置为单垃圾生成模式
    }

    /**
     * 播放垃圾桶正确动画
     * @param binNode 垃圾桶节点
     */
    private playCorrectBinAnimation(binNode: Node) {
        const binIndex = this.Bins.indexOf(binNode);
        if (binIndex === -1) return;

        const originalScale = new Vec3(1, 1, 1); // 原始大小
        this._binTweens[binIndex] = tween(binNode)
            .to(0.1, { scale: new Vec3(0.95, 0.9, 1) }, { easing: easing.quadOut }) // 缩小
            .to(0.1, { scale: new Vec3(1.05, 1.1, 1) }, { easing: easing.quadIn }) // 放大
            .to(0.1, { scale: originalScale }, { easing: easing.quadOut }) // 恢复
            .start();
    }

    /**
     * 播放垃圾桶错误动画
     * @param binNode 垃圾桶节点
     */
    private playWrongBinAnimation(binNode: Node) {
        const binIndex = this.Bins.indexOf(binNode);
        if (binIndex === -1) return;

        const originalPosition = binNode.position.clone();
        const shakeOffset = 5; // 震动偏移量

        this._binTweens[binIndex] = tween(binNode)
            .to(0.05, { position: new Vec3(originalPosition.x + shakeOffset, originalPosition.y, 0) })
            .to(0.05, { position: new Vec3(originalPosition.x - shakeOffset, originalPosition.y, 0) })
            .to(0.05, { position: new Vec3(originalPosition.x + shakeOffset, originalPosition.y, 0) })
            .to(0.05, { position: originalPosition })
            .start();
    }

    /**
     * 生成加分/减分星星
     * @param binNode 垃圾桶节点
     * @param prefab 预制体
     */
    private spawnStar(binNode: Node, prefab: Prefab) {
        if (!prefab) return;

        // 实例化预制体
        const starNode = instantiate(prefab);

        // 设置父节点为 GamePlay 节点
        starNode.setParent(this.gamePlay);

        // 设置位置为垃圾桶的位置
        starNode.setPosition(binNode.position);

        // 在0.8秒后销毁星星节点
        this.scheduleOnce(() => {
            starNode.destroy();
        }, STAR_DESTROY_DELAY);
    }

    /**
     * 生成游戏开始动画
     */
    private spawnStartAnim() {
        if (!this.StartAnimPrefab) return;

        // 实例化预制体
        const startAnimNode = instantiate(this.StartAnimPrefab);

        // 设置父节点为 GamePlay 节点
        startAnimNode.setParent(this.gamePlay);

        // 设置位置为 GamePlay 节点的中心
        startAnimNode.setPosition(0, 0, 0);

        // 在 2.5 秒后销毁动画节点
        this.scheduleOnce(() => {
            startAnimNode.destroy();
        }, START_ANIM_DESTROY_DELAY);
    }
}