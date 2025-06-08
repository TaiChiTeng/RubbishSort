import { _decorator, Component, Node, Label, EventTouch } from 'cc';
const { ccclass, property } = _decorator;

/**
 * @zh
 * 垃圾桶组件，用于处理垃圾桶的类型显示和点击事件。
 * @en
 * Bucket component for handling bucket type display and click events.
 */
@ccclass('Bucket')
export class Bucket extends Component {
    /**
     * @zh
     * 垃圾桶的类型 (recyclable, kitchen, other, hazardous)。
     * @en
     * The type of the bucket (recyclable, kitchen, other, hazardous).
     */
    @property({
        type: String,
        tooltip: '垃圾桶类型 (recyclable, kitchen, other, hazardous)' // Tooltip 提示
    })
    type: string = '';

    /**
     * @zh
     * 用于显示垃圾桶类型名称的 Label 组件。
     * @en
     * Label component for displaying the bucket type name.
     */
    @property({ type: Label, tooltip: '用于显示垃圾桶类型名称的 Label 组件' })
    label: Label = null;

    /**
     * @zh
     * 组件加载时执行。
     * @en
     * Called when the component is loaded.
     */
    onLoad() {
        // 监听节点的点击事件，使用 lambda 表达式绑定 this
        this.node.on(Node.EventType.TOUCH_END, this.onBucketClicked, this);
    }

    /**
     * @zh
     * 设置垃圾桶的类型。
     * @en
     * Sets the type of the bucket.
     * @param type 垃圾桶类型 (recyclable, kitchen, other, hazardous)
     */
    setType(type: string) {
        this.type = type;
        this.label.string = this.getBucketName(type);
    }

    /**
     * @zh
     * 垃圾桶被点击时执行。
     * @en
     * Called when the bucket is clicked.
     */
    onBucketClicked(event: EventTouch) {
        console.log('Bucket clicked: ' + this.type);
    }

    /**
     * @zh
     * 根据垃圾桶类型获取对应的名称。
     * @en
     * Gets the corresponding name based on the bucket type.
     * @param type 垃圾桶类型 (recyclable, kitchen, other, hazardous)
     * @returns 垃圾桶类型名称
     */
    getBucketName(type: string): string {
        const names = {
            recyclable: '可回收物',
            kitchen: '厨余垃圾',
            other: '其他垃圾',
            hazardous: '有害垃圾'
        };
        return names[type] || ''; // 如果类型不存在，返回空字符串
    }

    /**
     * @zh
     * 每一帧更新时执行。
     * @en
     * Called every frame.
     * @param deltaTime 帧之间的时间间隔
     */
    update(deltaTime: number) {
        //  每帧更新的逻辑，目前为空
    }
}