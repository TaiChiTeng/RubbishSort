// 1. 定义数据对象结构
let dataDemo = {
    data: [
        /*
        {
            rankScore: 0,
            avatarUrl: '',
            nickname: '',
        },
        */
    ],
};
// 2. 设置生成数据条数常量
const maxCount = 30;

// 3. 循环生成30条测试数据
for (let i = 0; i < maxCount; ++i) {
    // 3.1 创建空对象
    let item = {};
    // 3.2 生成0-499的随机积分
    item.rankScore = Math.floor((Math.random() * 500));
    // 3.3 设置固定头像路径
    item.avatarUrl = 'openDataContext/render/avatar.png';
    // 3.4 生成"Player_0"到"Player_9"的昵称
    item.nickname = 'Player_' + i;
    // 3.5 添加到数据数组
    dataDemo.data.push(item);
}
// 4. 按积分降序排序
dataDemo.data.sort((a, b) => b.rankScore - a.rankScore);
// 5. 导出数据结构
module.exports = dataDemo;