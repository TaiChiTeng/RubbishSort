import { _decorator, Component, Node, Label, Vec3, tween, Collider2D, Contact2DType, IPhysics2DContact } from 'cc';
const { ccclass, property } = _decorator;

/**
 * @zh
 * 垃圾组件，控制垃圾的行为，如下落、碰撞检测和销毁。
 * @en
 * Trash component, controls the behavior of trash, such as falling, collision detection, and destruction.
 */
@ccclass('Trash')
export class Trash extends Component {
    /**
     * @zh
     * 垃圾的类型 (recyclable, kitchen, other, hazardous)。
     * @en
     * The type of trash (recyclable, kitchen, other, hazardous).
     */
    @property({
        type: String,
        tooltip: '垃圾类型 (recyclable, kitchen, other, hazardous)'
    })
    trashType: string = '';

    /**
     * @zh
     * 垃圾下落的速度。
     * @en
     * The speed of the trash falling.
     */
    @property({
        type: Number,
        tooltip: '垃圾下落的速度'
    })
    speed: number = 100;  // Although defined, it's not used in current fall() implementation

    /**
     * @zh
     * 游戏管理器组件的引用，用于更新分数和访问游戏区域的高度。
     * @en
     * Reference to the game manager component, used to update scores and access the height of the game area.
     */
    @property({
        type: Object,  // No direct type reference to avoid circular dependency. Use 'Object'
        tooltip: '游戏管理器组件的引用'
    })
    gameManager: any = null; // Use 'any' type due to potential circular dependency

    /**
     * @zh
     * 初始化垃圾数据。
     * @en
     * Initializes the trash data.
     * @param trashData 包含垃圾类型和名称的数据对象。Data object containing the trash type and name.
     * @param gameManager 游戏管理器组件。The game manager component.
     */
    init(trashData: any, gameManager: any) {
        this.trashType = trashData.type;
        this.gameManager = gameManager;
        this.node.getChildByName('Label').getComponent(Label).string = trashData.name;
    }

    /**
     * @zh
     * 控制垃圾下落的动作。
     * @en
     * Controls the action of the trash falling.
     */
    fall() {
        const targetPosition = new Vec3(this.node.position.x, -this.gameManager.gameArea.height / 2, 0);

        tween(this.node)
            .to(3, { position: targetPosition }, { easing: 'linear' })
            .call(() => {
                this.node.destroy();
            })
            .start();
    }

    /**
     * @zh
     * 碰撞检测事件处理函数。
     * @en
     * Collision detection event handler.
     * @param other 碰撞到的另一个碰撞器。The other collider that was collided with.
     * @param self  自身的碰撞器。The own collider.
     */
    onCollisionEnter(other: Collider2D, self: Collider2D, contact: IPhysics2DContact | null) {
        if (other.node.group === 'bucket') {
            const isCorrect = this.trashType === other.node.getComponent('Bucket').type;
            this.gameManager.updateScore(isCorrect);
            this.node.destroy();
        }
    }

    /**
     * @zh
     * 组件加载时执行。在这里注册碰撞回调函数。
     * @en
     * Called when the component is loaded.  Register collision callbacks here.
     */
    onLoad() {
        let collider = this.getComponent(Collider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
        }
    }

    /**
     * @zh
     * 组件销毁时执行。在这里取消注册碰撞回调函数。
     * @en
     * Called when the component is destroyed.  Unregister collision callbacks here.
     */
    onDestroy() {
        let collider = this.getComponent(Collider2D);
        if (collider) {
            collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
        }
    }

    /**
     * @zh
     * 每一帧更新时执行。
     * @en
     * Called every frame.
     * @param deltaTime 帧之间的时间间隔。The time interval between frames.
     */
    update(deltaTime: number) {
        //  每帧更新的逻辑，目前为空
    }
}