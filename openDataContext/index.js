// 引入样式、模板和布局引擎模块
const style = require('./render/style')         
const template = require('./render/template')  
const Layout = require('./engine').default;    // 布局引擎默认导出

// 初始化环境变量（兼容多平台）
let __env = GameGlobal.wx || GameGlobal.tt || GameGlobal.swan;  // 判断运行环境：微信/字节/百度小游戏

// 获取共享画布（小游戏渲染层）
let sharedCanvas  = __env.getSharedCanvas();   // 获取平台提供的共享画布
let sharedContext = sharedCanvas.getContext('2d');  // 获取2D绘图上下文

// 初始化模板和视口变量
let default_template = '<view class="container" id="main"><view class="header"><text class="title" value="正在获取排行榜..."></text></view></view>';  // 初始XML模板
let curr_template = default_template;          // 当前模板（会动态更新）
let currViewport = null;                       // 当前视口参数

// 绘制函数：清空并重新布局
function draw() {
    Layout.clear();                            // 清空布局缓存
    Layout.init(curr_template, style);         // 用当前模板和样式初始化布局
    Layout.layout(sharedContext);              // 在指定上下文上执行布局渲染
}

// 更新视口参数
function updateViewPort(data) { 
    currViewport = {                           // 存储新的视口参数
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
    };
    Layout.updateViewPort(currViewport);       // 通知布局引擎视口变化
}

// 注册消息监听：处理来自主线程的消息
__env.onMessage(data => {
    if (data.type === 'engine') {              // 只处理引擎相关消息
        switch(data.event) {
            case 'viewport':                   // 视口变化事件
                updateViewPort(data);
                draw();                        // 触发重绘
                break;
                
            case 'updateScore':                // 分数更新事件
                console.log("updateScore");
                wx.getUserCloudStorage({       // 获取用户云存储数据
                    keyList: [data.cloudStorageKey],  // 指定要读取的键
                    success: (res) => {        // 读取成功回调
                        // 解析已有数据
                        let dailyData = { 
                            version: data.cloudStorageVersion,  // 数据版本
                            date: data.scoreDate,               // 记录日期
                            highestScore: data.highestScore      // 历史最高分
                        };
                        let dirty = false;                     // 数据是否需要更新标志

                        // 1. 检查云端已有数据
                        if (res.KVDataList && res.KVDataList.length > 0) {
                            const storedData = JSON.parse(res.KVDataList[0].value);
                            // 2. 版本相同且已有历史分更高则保留
                            if (storedData.version == data.cloudStorageVersion 
                                && storedData.highestScore > dailyData.highestScore) {
                                dailyData.highestScore = storedData.highestScore;
                            }
                            // 3. 版本日期相同且已有数据不落后则无需更新
                            if (storedData.version == data.cloudStorageVersion 
                                && storedData.date === dailyData.date 
                                && storedData.highestScore >= dailyData.highestScore) {
                                // 保持原数据
                            } else {
                                dirty = true;  // 需要更新
                            }
                        } else {
                            dirty = true;      // 无数据需要初始化
                        }

                        // 需要更新时写入云存储
                        if (dirty) {
                            wx.setUserCloudStorage({
                                KVDataList: [
                                    { 
                                        key: data.cloudStorageKey, 
                                        value: JSON.stringify(dailyData)  // 序列化存储
                                    }
                                ],
                                success: () =>  {  // 写入成功回调
                                    console.log("云存储成功 highestScore:" + dailyData.highestScore);
                                    // 写入成功后获取好友数据
                                    console.log("updateRank");
                                    wx.getFriendCloudStorage({
                                        keyList: [data.cloudStorageKey],
                                        success: (friendRes) => {
                                            console.log("updateRank friend succ " + friendRes);
                                            let fullData = friendRes.data;
                                            renderRankList(fullData, data.cloudStorageVersion, data.scoreDate);
                                        }
                                    });
                                },
                                fail: (err) => console.error("云存储失败", err)
                            });
                        } else {
                            // 无需更新直接获取好友数据
                            console.log("updateRank");
                            wx.getFriendCloudStorage({
                                keyList: [data.cloudStorageKey],
                                success: (friendRes) => {
                                    console.log("updateRank friend succ " + friendRes);
                                    let fullData = friendRes.data;
                                    renderRankList(fullData, data.cloudStorageVersion, data.scoreDate);
                                }
                            });
                        }
                    }
                });
                break;
        }
    }
});

// 渲染排行榜列表
function renderRankList(friendDataRaw, storeVersion, rankDate) {
    let friendData = [];
    // 1. 解析好友原始数据
    friendDataRaw.forEach((friend, index) => {
        if (friend.KVDataList && friend.KVDataList.length > 0) {
            let friendItem = JSON.parse(friend.KVDataList[0].value);
            friendItem.avatarUrl = friend.avatarUrl;  // 补充头像信息
            friendItem.nickname = friend.nickname;    // 补充昵称信息
            friendData.push(friendItem);
        }
    });

    console.log("rankData ", friendData);
    
    // 2. 按历史得分降序排序
    friendData.sort((a, b) => {
        return b.highestScore - a.highestScore;  // 数值大的排前面
    });

    // 3. 过滤符合条件的数据
    let template_data = {
        data: []  // 初始化模板数据
    };
    
    friendData.forEach((friend, index) => {
        console.log(`friend index${index} version: ${friend.version} date: ${friend.date} highestScore: ${friend.highestScore}`);
        
        // 筛选版本和日期匹配的数据
        if (friend.version == storeVersion && friend.date == rankDate) {
            template_data.data.push({
                rankScore: friend.highestScore,       // 排行榜显示的分数
                avatarUrl: friend.avatarUrl,     // 用户头像
                nickname:  friend.nickname,      // 用户昵称
            });
        }
    });

    // 4. 构建新模板并渲染
    curr_template = template.build_template(template_data);  // 根据数据生成新模板
    console.log(curr_template);
    
    // 5. 触发重新布局
    if (currViewport != null) {
        Layout.updateViewPort(currViewport);  // 更新视口
        draw();                               // 重新绘制
    }
}