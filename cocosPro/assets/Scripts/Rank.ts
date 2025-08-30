import { _decorator, Component, Node, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Rank')
export class Rank extends Component {
    private readonly EASY_SCORE_KEY = "easy_score";
    private readonly HARD_SCORE_KEY = "hard_score";
    private readonly STORE_VERSION = 10;

    localEasyStorageData = {version: this.STORE_VERSION, date: "0000-0-0", highestScore: 0}
    localHardStorageData = {version: this.STORE_VERSION, date: "0000-0-0", highestScore: 0}

    userInfo = {avatarUrl:"", nickname:"你"}

    start() {
        if (sys.platform == "WECHAT_GAME") {
            wx.showShareMenu({menus: ['shareAppMessage', 'shareTimeline']});
            wx.onShareAppMessage(function () {
                return {
                    title: "一起来学习垃圾分类吧！"
                };
            });
            wx.onShareTimeline(function () {
                return {
                    title: "一起来学习垃圾分类吧！"
                };
            });
        }
        this.localEasyStorageData = this.loadLocalStorage(false);
        this.localHardStorageData = this.loadLocalStorage(true);
    }

    loadUserInfo() {
    }

    getHistoryHighScore(isHard:boolean) :number {
        return isHard ? this.localHardStorageData.highestScore : this.localEasyStorageData.highestScore;
    }

    loadLocalStorage(isHard:boolean) : any {
        const savedData = sys.localStorage.getItem(isHard ? this.HARD_SCORE_KEY : this.EASY_SCORE_KEY);
        if (savedData) {
            try {
                let loadedData = JSON.parse(savedData);
                if (loadedData.version == this.STORE_VERSION) {
                    return loadedData;
                }
            }
            catch (e) {
                console.log("读取本地存储失败，使用默认值", e);
            }
        }
        return isHard ? this.localHardStorageData : this.localEasyStorageData;
    }

    update(deltaTime: number) {
        
    }
    
    getChinaDate() : Date {
        const now = new Date();
        const utcTime = now.getTime() + now.getTimezoneOffset() * 60000; // 转UTC时间戳
        const chinaOffset = 8; // 中国UTC+8
        return new Date(utcTime + chinaOffset * 3600000);
    }
    
    getCurrentDate(): string {
        const now = new Date();
        
        const chinaOffset = 8 * 60;
        const totalOffset = (chinaOffset) * 60 * 1000;
        const chinaTime = new Date(now.getTime() + totalOffset);
        
        const year = chinaTime.getUTCFullYear();
        const month = (chinaTime.getUTCMonth() + 1).toString();
        const day = chinaTime.getUTCDate().toString();
        
        return `${year}-${month}-${day}`;
    }

    updateScoreLocal(newScore: number, isHard:boolean) {
        let currentDate = this.getCurrentDate();
        let storageData = isHard ? this.localHardStorageData : this.localEasyStorageData;
        if (storageData.version != this.STORE_VERSION || storageData.date != currentDate){
            storageData.highestScore = 0;
        }
        if (storageData.highestScore < newScore) {
            storageData.version = this.STORE_VERSION;
            storageData.date = currentDate;
            storageData.highestScore = Math.max(newScore, storageData.highestScore);
            sys.localStorage.setItem(isHard ? this.HARD_SCORE_KEY : this.EASY_SCORE_KEY, JSON.stringify(storageData));
        }
    }

    updateScore(newScore: number, isHard:boolean) {  
        this.updateScoreLocal(newScore, isHard);
        if (sys.platform == "WECHAT_GAME") {
            const currentDate = this.getCurrentDate();
            
            let storageData = isHard ? this.localHardStorageData : this.localEasyStorageData;
            let openDataContext = wx.getOpenDataContext();
            openDataContext.postMessage({
                type: "engine",
                event: "updateScore",
                cloudStorageVersion: this.STORE_VERSION,
                cloudStorageKey: isHard ? this.HARD_SCORE_KEY : this.EASY_SCORE_KEY,
                highestScore: storageData.highestScore,
                scoreDate: currentDate
            });
        }
    }

    updateRank(isHard:boolean) {
        if (sys.platform == "WECHAT_GAME") {
            const currentDate = this.getCurrentDate();
            
            let openDataContext = wx.getOpenDataContext();
            openDataContext.postMessage({
                type: "engine",
                event: "updateRank",
                cloudStorageVersion: this.STORE_VERSION,
                cloudStorageKey: isHard ? this.HARD_SCORE_KEY : this.EASY_SCORE_KEY,
                scoreDate: currentDate
            });
        }
    }
}


