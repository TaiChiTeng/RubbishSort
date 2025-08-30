const dataDemo = require('./dataDemo')

/*
<view class="container" id="main">
  <view class="header">
    <text class="title" value="排行榜"></text>
  </view>
  <view class="rankList">
        <scrollview class="list">
            {{~it.data :item:index}}
                {{? index % 2 === 1 }}
                <view class="listItem listItemOld">
                {{?}}
                {{? index % 2 === 0 }}
                <view class="listItem">
                {{?}}
                    <view id="listItemUserData">
                        <text class="listItemNum" value="{{= index + 1}}"></text>
                        <image class="listHeadImg" src="{{= item.avatarUrl }}"></image>
                        <text class="listItemName" value="{{= item.nickname}}"></text>
                    </view>
                    <text class="listItemScore" value="{{= item.rankScore}} 分"></text>
                </view>
            {{~}}
        </scrollview>
        <text class="listTips" value="仅展示前 {{= it.data.length}} 位好友排名"></text>
    </view>
</view>
*/

// 上述模板经过模板引擎编译成版本函数，可通过 olado.github.io/doT/index.html 在线获得
export function build_template(it) { 
    // 导出函数，参数it可能是一个包含数据的数据对象
    var out='<view class="container" id="main"><view class="rankList">';
    // 初始化输出字符串，开始构建外层容器视图，类名为container，id为main，内层视图类名rankList
    
    var arr1=it.data;
    // 从传入的参数it中获取数据数组，赋值给arr1
    
    if(arr1){
        // 检查数据数组是否存在，防止空数据报错
        var item,index=-1,l1=arr1.length-1;
        // 初始化循环变量：item为当前元素，index从-1开始，l1是数组最大索引值
        
        while(index<l1){
            // 使用while循环遍历数组，条件为当前索引小于最大索引
            item=arr1[index+=1];
            // 先自增index（从0开始），然后获取当前元素
            
            out+=' <view class="listItem"> ';
            // 添加列表项容器开始标签，类名listItem
            
            out+=' <view id="listItemUserData"> <text class="listItemNum" value="'+( index + 1)+'"></text> <image class="listHeadImg" src="'+( item.avatarUrl )+'"></image> <text class="listItemName" value="'+( item.nickname)+'"></text> </view>';
            // 构建用户信息区域：
            // 1. 排名序号（index+1）
            // 2. 头像图片（item.avatarUrl）
            // 3. 用户昵称（item.nickname）
            
            out+=' <text class="listItemScore" value="'+( item.rankScore)+' 分"></text></view> ';
            // 分数显示（item.rankScore + " 分"）
        } 
    } 
    
    out+='</view></view>';
    // 闭合外层视图标签
    
    return out; 
    // 返回最终拼接好的HTML字符串
}
