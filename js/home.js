/// <reference path="jquery-1.8.2.min.js" />

$(function () {
    game.initialize(allQuestionsArr);
});

/*游戏对象*/
var game = {
    maxTimeStr: '00:15:00',
    $cWrapper: null,
    $gWrapper: null,
    $gOverWrapper: null,
    timeInterval: null,
    questionsArr: [],
    answersArr: [],  //答题情况  预留的
    totalScores: 0,  //总分

    /*连击情况*/
    doubleHitNums: 0,
    doubleHitNumsArr: [],

    /*已答总题数*/
    totalDoneQuestionsNum: 0,

    /*最后一题的答题情况*/
    lastOneAnswerFlag: false,

    namsAndLevelsArr: [{ level: 'SSS', levelImg: '../images/gameover/sss.png', name: '神级设计师', max: 300000000000, min: 25000 },
        { level: 'S', levelImg: '../images/gameover/s.png', name: '千年古尸', max: 24900, min: 20000 },
        { level: 'A', levelImg: '../images/gameover/a.png', name: '松狮', max: 19900, min: 15000 },
        { level: 'B', levelImg: '../images/gameover/b.png', name: '山村老尸', max: 14900, min: 10000 },
        { level: 'C', levelImg: '../images/gameover/c.png', name: '村口王师傅', max: 9900, min: 5000 },
        { level: 'D', levelImg: '../images/gameover/d.png', name: '苍老湿', max: 4900, min: 0 }],

    /**初始化游戏**/
    initialize: function (qArr) {
        this.questionsArr = qArr;
        this.$cWrapper = $('.contentWrapper');
        this.$gWrapper = $('.gameContentWrapper');
        this.$gOverWrapper = $('.gameOverWrapper');
        this.eventsInit();
        this.setRecordsAndNoticeStyle();
    },

    /*事件注册*/
    eventsInit: function () {

        var $btns = this.$cWrapper.find('.btns');
        var $recorders = this.$cWrapper.find('.gameRecords');
        var that = this;

        /*开始游戏  | 查看记录*/
        $btns.on('click', 'div', function () {
            var index = $(this).index();
            if (index == 1) {
                that.$cWrapper.find('.gameNotice').hide();
                that.$cWrapper.find('.gameRecords').show();
            } else {
                that.showGameContentWrapper();
            }
        });

        /*关闭记录*/
        $recorders.on('click', '.closeGameRecords', function () {
            $recorders.hide();
        });

        /*显示游戏规则*/
        this.$cWrapper.on('click', '.aboutGameNotice', function () {
            that.$cWrapper.find('.gameRecords').hide();
            that.$cWrapper.find('.gameNotice').show();
        });

        this.$cWrapper.on('click', '.closeGameNotice', function () {
            that.$cWrapper.find('.gameNotice').hide();
        });

        /*题目答案选择*/
        that.$gWrapper.on('click', '.gameContentBtns>div', function () {
            var $q = that.$gWrapper.find('.gameContentQuestion'),
                  qid = $q.attr('data-qid'),  //当前题号
                  currentAnswer = !$(this).index();//当前题号的答案


            //保存所回答问题
            that.answersArr.push({
                qid: qid,
                answer: currentAnswer
            });

            /*当前题目答题情况判断*/
            that.checkoutCurrentAnswer(qid, currentAnswer);

            that.fillInQuestionToDom();   //随机出题
        });

        /*分享和 再来一局*/
        that.$gOverWrapper.on('click', '.oneMoreTime', function () {
            var index = $(this).index();
            if (index == 1) {
                that.restarGame();
            }
        });

        $('.btnsItem').on('touchstart', function () { });
    },

    /*
    *开始游戏
    *需要执行以下过程：1.从服务器取题库；2.随机从得到的题中选择一题；3.开始计时
    */
    showGameContentWrapper: function (imgSrc) {
        this.$cWrapper.hide();
        this.swapClass($('.gameContentWrapper'), 'gameContentWrapperHide', 'gameContentWrapperShow');
        this.getQuestionsFromService(function (data) {
            this.questionsArr = data;
            this.fillInQuestionToDom();   //随机出题
            this.initTimeDetailInfo();//初始化时间
            this.setTimeOutInfo(1000);
        });
    },

    /*从服务器取题目*/
    getQuestionsFromService: function (callback) {
        var that = this;
        data = this.questionsArr;
        callback.call(that, data);
        //$.post('', null, function (data) {
        //    callback.call(that, data);
        //});

    },

    /*
    *当前题目对错判断
    *Parameters:
    *qid:{string} 当前题号id,
    *currentAnswer:{bool}当前选择答案 true | false
    */
    checkoutCurrentAnswer: function (qid, currentAnswer) {
        window.clearInterval(this.timeInterval);  /*暂停计时器*/
        var that = this,
            $p = this.$gWrapper.find('.doubleHitInfo > p'),
            $hitNums = $p.find('.doubleHitNums'),
            $btns = this.$gWrapper.find('.gameContentBtns>div');
        var temp = $.grep(that.questionsArr, function (item, key) {
            return item.qId == qid;
        })[0];

        //答题正确
        if (temp.answer == currentAnswer) {
            this.doubleHitNums++;
            var $temp = $btns.eq(!currentAnswer);
            $temp.addClass('btnsCorrect');
            window.setTimeout(function () {
                $temp.removeClass('btnsCorrect');  //显示正确效果
            }, 100);
            if (this.doubleHitNums > 1) {
                $hitNums.text(this.doubleHitNums);
                $p.addClass('doubleHitNumsShow');
            }
            that.lastOneAnswerFlag = true;
        }

            //答题错误
        else {
            $p.removeClass('doubleHitNumsShow');
            this.doubleHitNumsArr.push(this.doubleHitNums);
            this.doubleHitNums = 0;
            that.lastOneAnswerFlag = false;
            $('.wrongAnsweInfo').addClass('wrongAnsweInfoShow');
        }
        $('.rightAnsweInfo').show().delay(500).hide(0);
        /*重启计时器*/
        window.setTimeout(function () {
            //$btns.removeClass('btnsCorrect')
            $('.wrongAnsweInfo').removeClass('wrongAnsweInfoShow');
            $p.removeClass('doubleHitNumsShow');
            that.setTimeOutInfo(0);
        }, 500);
    },

    /*填充问题内容*/
    fillInQuestionToDom: function () {
        var $q = this.$gWrapper.find('.gameContentQuestion'),
              oQId = $q.attr('data-qid'),
             qInfo = this.showQuestionByRandom(oQId);
        $q.attr('data-qid', qInfo.qId);
        $q.find('p').text(qInfo.qDescription);
        this.changeQuestionTileAndBg();
    },

    /*随机出题*/
    showQuestionByRandom: function (oQId) {
        var index = this.getRandomNum(this.questionsArr.length);
        var qIf = this.questionsArr[index];
        if (qIf && oQId != qIf.qId) {
            return qIf;
        } else {
            return this.showQuestionByRandom(oQId);
        }
    },

    /*更换题号和背景图*/
    changeQuestionTileAndBg: function () {
        this.totalDoneQuestionsNum++;
        //var questionNumImg = '../images/gamecontent/n' + this.totalDoneQuestionsNum + '.png',
        var bgImg = '../images/gamecontent/p' + this.getRandomNum(1, 5) + '.png';
        this.$gWrapper.find('.gameContentPeople').css('background-image', 'url(' + bgImg + ')');
        this.$gWrapper.find('#totalDoneQuestionsNum').text(this.totalDoneQuestionsNum);
    },

    /*设置计时器*/
    setTimeOutInfo: function (num) {
        var that = this;
        var $timeLabel = this.$gWrapper.find('.timeDetailInfo');
        window.setTimeout(function () {
            window.clearInterval(that.timeInterval);
            that.timeInterval = window.setInterval(function () {
                that.updateTimeShowInfo.call(that, $timeLabel);
            }, 10);
        }, num);
    },

    /*初始化最大时间*/
    initTimeDetailInfo: function () {
        this.$gWrapper.find('.timeDetailInfo').text(this.maxTimeStr);
    },

    /*更新显示出来的时间*/
    updateTimeShowInfo: function ($label) {
        var numArr = $label.text().split(':'),
            numS = numArr[1] | 0,
            numMs = numArr[2] | 0;
        if (numS == 0 & numMs == 0) {
            num = ('00:00:00');
            this.gameOver();
        } else {
            if (numMs == 0) {
                numMs = 99;
                numS--;
            }
        }
        if (numS < 10) {
            numS = '0' + numS;
        }
        numMs -= 1;
        if (numMs < 10) {
            numMs = '0' + numMs;
        }
        $label.text('00:' + numS + ':' + numMs);

    },

    /*
    *游戏结束
    *得到具体的 答对情况数组,true表示正确，false表示错误：[true,false,false,false,false,false,true]
    */
    gameOver: function () {
        console.log('时间到！');
        window.clearInterval(this.timeInterval);
        this.showDetailGameScores();/*显示具体的分数，并将游戏结果传到服务器*/
        this.gameOverStyleChage();  //显示本次游戏结果

    },

    /*
    *游戏得分计算
    *根据连击情况计算分数
    *计算规则 ：
    1题                 +100分
    2连击2*500    +1000分    
    3连击3*500    +1500分   
    4连击4*500    +2000分   
    ···
    30···30*500    +15000分
    *
    */
    calculateScroes: function () {
        var scores = 0;

        //最一次答案，防止在没有出现错题的情况下，没有进行连击的计算
        if (this.lastOneAnswerFlag) {
            this.doubleHitNumsArr.push(this.doubleHitNums);
        }
        $.each(this.doubleHitNumsArr, function () {
            scores += this * 100;
            if (this != 1) {
                scores += this * 500;
            }
        });
        return scores;
    },

    /*
    *根据游戏得分计算称号
    */
    calculateName: function () {

    },

    /*将游戏结果传到服务器*/
    commitResultToService: function (recorInfo) {
        /*本地存储*/
        var storage = window.localStorage,
           recordsStr = storage.myGameRecords,
           recordsArr = JSON.parse(recordsStr);
        if (recordsArr == null) {
            recordsArr = [];
        }
        recordsArr.push(recorInfo);
        storage.myGameRecords = JSON.stringify(recordsArr);
        /*上传服务器*/
    },

    /*显示本次游戏 界面效果*/
    gameOverStyleChage: function () {
        this.$gOverWrapper.show();
        this.$gWrapper.find('.gameContentBtns>div').removeClass('btnsCorrect');
        this.swapClass(this.$gWrapper, 'gameContentWrapperShow', 'gameContentWrapperHide');
        this.swapClass(this.$gOverWrapper.find('.gameResultPanel'), 'gameResultPanelHide', 'gameResultPanelShow');
        this.swapClass(this.$gOverWrapper.find('.gameRankingListPanel'), 'gameRankingListPanelHide', 'gameRankingListPanelShow');
    },

    /*
    *显示具体的分数，将游戏结果传到服务器
    *制作一个分数滚动效果
    */
    showDetailGameScores: function () {
        var that = this,
            $scores = $('#totalScores'),
            totalScores = this.calculateScroes(),
            interval = 10,
            baseScore = 0;
        this.totalScores = totalScores;

        //得到等级、名称
        var levelsItem = $.grep(this.namsAndLevelsArr, function (item) {
            return item.max >= totalScores && item.min <= totalScores;
        })[0];
        baseScore = levelsItem.min;  //设计滚动时的最小数

        if (totalScores > 1000 && totalScores - baseScore <= 250) {
            baseScore = totalScores - 250;
        }
        //滚动计时器
        if (totalScores > 100) {
            var tempInterval = window.setInterval(function () {
                baseScore += 50;
                $scores.text(baseScore);
                if (baseScore == totalScores) {
                    window.clearInterval(tempInterval);
                    that.setNameAndLevelInfo(levelsItem);   //设置等级和名称
                }
            }, interval);
        } else {
            $scores.text(totalScores);
            that.setNameAndLevelInfo(levelsItem);   //设置等级和名称
        }
        var record = { name: levelsItem.name, level: levelsItem.level, date: new Date().format('yyyy-MM-dd'), scores: this.totalScores + '分' };
        this.commitResultToService(record);    /*将游戏结果传到服务器*/
    },

    /*设置等级和名称*/
    setNameAndLevelInfo: function (levelsItem) {
        var $level = this.$gOverWrapper.find('.scoresLevel'),
             $honor = this.$gOverWrapper.find('#yourHonor');
        $level.css('background-image', 'url(' + levelsItem.levelImg + ')');  //设置等级图片  
        this.swapClass($level, 'scoreLevelHide', 'scoreLevelShow');
        this.$gOverWrapper.find('#yourHonor').text(levelsItem.name);//设置等级名称
        this.swapClass($honor, 'yourHonorHide', 'yourHonorShow');
    },

    /*
    *重新开始游戏
    *需要执行以下过程：
    *1.显示首页，隐藏当前的页面。
    *2.页面效果 之前出现的效果类要去除包括：
    *   游戏主面板的 滑入效果，结果板的 掉下效果
    *3.清除上次游戏信息 计时的数字改成30s
    *
    */
    restarGame: function () {
        this.clearGameInfo();  //清除上次游戏信息
        this.$cWrapper.delay(500).show(0);

        this.swapClass(this.$gWrapper, 'gameContentWrapperShow', 'gameContentWrapperHide');
        this.swapClass(this.$gOverWrapper.find('.gameResultPanel'), 'gameResultPanelShow', 'gameResultPanelHide');
        this.swapClass(this.$gOverWrapper.find('.scoresLevel'), 'scoreLevelShow', 'scoreLevelHide');
        this.swapClass(this.$gOverWrapper.find('.gameRankingListPanel'), 'gameRankingListPanelShow', 'gameRankingListPanelHide');
    },

    /*清除上次游戏信息*/
    clearGameInfo: function () {
        $('#totalScores').text('');
        this.totalScores = 0;
        this.answersArr = [];
        this.doubleHitNums = 0;
        this.doubleHitNumsArr = [];
        this.totalDoneQuestionsNum = 0;
    },

    /*
    *得到随机数
    *Parameters:
    *minNum - {int} 可能出现的最小值
    *maxNum - {int} 可能出现的最大值
    *Returns:
    *num - {int} 得到的随机数
    */
    getRandomNum: function (maxNum, minNum) {
        if (!minNum) {
            minNum = 0;
        }
        var range = maxNum - minNum;
        var index = Math.round(Math.random() * range) + minNum;
        return index;
    },

    /*
    *样式转换
    *Parameters:
    *$target - {jquery object} jquery对象
    *oClass - {string} 旧类
    *nClass - {string} 
    */
    swapClass: function ($target, oClass, nClass) {
        $target.removeClass(oClass).addClass(nClass);
    },

    /*让游戏记录，公告等居中显示*/
    setRecordsAndNoticeStyle: function () {
        var h = this.$cWrapper.height(),
            w = this.$cWrapper.width(),
            $records = this.$cWrapper.find('.gameRecords'),
            rw = $records.width(),
            rh = $records.height(),
            $notice = this.$cWrapper.find('.gameNotice'),
            nw = $notice.width(),
            nh = $notice.height();
        $records.css({ 'top': (h - rh) / 2.6, 'left': (w - rw) / 2 });
        $notice.css({ 'top': (h - nh) / 2.6, 'left': (w - nw) / 2 });
    },

    OBJECT_NAME: 'game'
};

/*angularjs 数据绑定*/
var app = angular.module('myApp', []);
app.controller('gameRecordsController', function ($scope, $http) {

    var storage = window.localStorage,
        records = storage.getItem('myGameRecords'),
        data = JSON.parse(records),
        $p = $('.gameRecordsContent p');

    //var data = [{ name: '神级设计尸', date: '2015.9.28', scores: '45665分' }, { name: '新东方厨师', date: '2015.9.28', scores: 42665 },
    //    { name: '千年老尸', date: '2015.9.28', scores: 40665 }, { name: '苍老师', date: '2015.9.28', scores: 35665 },
    //    { name: '撸大湿', date: '2015.9.28', scores: 25665 }, { name: '村口王师傅', date: '2015.9.28', scores: 15665 }];
    if (!data) {
        storage.setItem('myGameRecords', null);
        $p.show();
    } else {
        data = data.reverse(function (val1, val2) {
            return val1 - val2;
        });
        $p.hide();
    }
    $scope.items = data;
});

function compare(val1, val2) {
    return val1 - val2;
}

/*
*拓展Date方法。得到格式化的日期形式 基本是什么格式都支持
**date.format('dd.MM.yy'), date.format('yyyy.dd.MM'), date.format('yyyy-MM-dd HH:mm')   等等都可以
*/
Date.prototype.format = function (format) {
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(), //day
        "h+": this.getHours(), //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
        "S": this.getMilliseconds() //millisecond
    }
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
    (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o) if (new RegExp("(" + k + ")").test(format))
        format = format.replace(RegExp.$1,
        RegExp.$1.length == 1 ? o[k] :
        ("00" + o[k]).substr(("" + o[k]).length));
    return format;
}

var allQuestionsArr = [{ qId: 1, qDescription: "在ps中，“剪切”的快捷键是“F2”吗？", answer: true }, { qId: 2, qDescription: "在ps中，“粘贴”的快捷键是“F4”吗？", answer: true }, { qId: 3, qDescription: "在ps中，“还原/重做”的快捷键是“Ctrl+Z”吗？", answer: true }, { qId: 4, qDescription: "在ps中，“打开为”的快捷键是“Ctrl+Alt+P ”吗？", realAnswer: "（不是，是Ctrl+Alt+O ）", answer: false }, { qId: 5, qDescription: "在ps中，“新建图形文件”的快捷键是“Ctrl+M”吗？", realAnswer: "（不是，是Ctrl+N）", answer: false }, { qId: 6, qDescription: "在ps中，“合并拷贝”的快捷键是“Ctrl+Shift+V”吗？", realAnswer: "（不是，是Ctrl+Shift+C）", answer: false }, { qId: 7, qDescription: "在ps中，“打开已有的图像”的快捷键是“Ctrl+O”吗？", answer: true }, { qId: 8, qDescription: "在ps中，“淡入/淡出”的快捷键是“Ctrl+Shift+F”吗？", answer: true }, { qId: 9, qDescription: "在ps中，“拷贝”的快捷键是“Ctrl+C ”吗？", answer: true }, { qId: 10, qDescription: "在ps中，“退出”的快捷键是“Ctrl+W”吗？", realAnswer: "（不是，是Ctrl+Q）", answer: false }, { qId: 11, qDescription: "在ps中，“关闭”的快捷键是“Ctrl+Q ”吗？", realAnswer: "（不是，是Ctrl+W）", answer: false }, { qId: 12, qDescription: "在ps中，“反相”的快捷键是“Ctrl+O”吗？", realAnswer: "（不是，是Ctrl+I）", answer: false }, { qId: 13, qDescription: "在ps中，“辅助线”的快捷键是“Ctrl+R”吗？", answer: true }, { qId: 14, qDescription: "在ps中，“羽化”的快捷键是“Shift+F6”吗？", answer: true }, { qId: 15, qDescription: "在ps中，“自由变换”的快捷键是“Ctrl+T”吗？", answer: true }, { qId: 16, qDescription: "在ps中，“下移一层”的快捷键是“Ctrl+]”吗？", realAnswer: "（不是，是Ctrl+[）", answer: false }, { qId: 17, qDescription: "在ps中，“上移一层”的快捷键是“Ctrl+[”吗？", realAnswer: "（不是，是Ctrl+]）", answer: false }, { qId: 18, qDescription: "在ps中，“调整色阶”的快捷键是“Ctrl+B”吗？", realAnswer: "（不是，是Ctrl+L）", answer: false }, { qId: 19, qDescription: "在ps中，“色彩平衡”的快捷键是“Ctrl+B”吗？", answer: true }, { qId: 20, qDescription: "在ps中，“另存为”的快捷键是“Ctrl+Shift+S”吗？", answer: true }, { qId: 21, qDescription: "在ps中，“色相/饱和度”的快捷键是“Ctrl+U”吗？", answer: true }, { qId: 22, qDescription: "在ps中，“合并可见图层”的快捷键是“Ctrl+Shift+R”吗？", realAnswer: "（不是，是Ctrl+Shift+E）", answer: false }, { qId: 23, qDescription: "在ps中，“通过拷贝建立一个图层”的快捷键是“Ctrl+I”吗？", realAnswer: "（不是，是Ctrl+J）", answer: false }, { qId: 24, qDescription: "在ps中，“加大画笔大小”的快捷键是“Ctrl+BackSpace”吗？", realAnswer: "（不是，是Alt+BackSpace）", answer: false }, { qId: 25, qDescription: "在ps中，“向下合并或合并联接图层”的快捷键是“Ctrl+E”吗？", answer: true }, { qId: 26, qDescription: "在ps中，“建立一个通过拷贝的图层”的快捷键是“Ctrl+Alt+J”吗？", answer: true }, { qId: 27, qDescription: "在ps中，“全图调整”的快捷键是“Ctrl+Shift+U”吗？", answer: true }, { qId: 28, qDescription: "在ps中，“反相删除”的快捷键是“Ctrl+Shift+J”吗？", realAnswer: "（不是，是Ctrl+Shift+I）", answer: false }, { qId: 29, qDescription: "在ps中，“与前一图层编组”的快捷键是“Ctrl+H”吗？", realAnswer: "（不是，是Ctrl+G）", answer: false }, { qId: 30, qDescription: "在ps中，“填充前景色”的快捷键是“Ctrl+Delete”吗？", realAnswer: "（不是，是Alt+Delete）", answer: false }, { qId: 31, qDescription: "在ps中，“取消编组”的快捷键是“Ctrl+Shift+G”吗？", answer: true }, { qId: 32, qDescription: "在ps中，“填充背景色”的快捷键是“Ctrl+Delete”吗？", answer: true }, { qId: 33, qDescription: "在ps中，“页面设置”的快捷键是“Ctrl+Shift+P”吗？", answer: true }, { qId: 34, qDescription: "在ps中，“打开“预置”对话框”的快捷键是“Ctrl+L”吗？", realAnswer: "（不是，是Ctrl+K）", answer: false }, { qId: 35, qDescription: "在ps中，“羽化选择”的快捷键是“Ctrl+Alt+F”吗？", realAnswer: "（不是，是Ctrl+Alt+D）", answer: false }, { qId: 36, qDescription: "在ps中，“反向选择”的快捷键“Ctrl+Shift+J”吗？", realAnswer: "（不是，是Ctrl+Shift+I）", answer: false }, { qId: 37, qDescription: "在ps中，“粘贴”的快捷键是“Ctrl+V”吗？", answer: true }, { qId: 3738, qDescription: "在ps中，“剪贴”的快捷键是“Ctrl+X”吗？", answer: true }, { qId: 39, qDescription: "在ps中，快捷键“F2”是“剪切”的意思吗？", answer: true }, { qId: 40, qDescription: "在ps中，快捷键“F4”是“粘贴”的意思吗？", answer: true }, { qId: 3741, qDescription: "在ps中，快捷键“Ctrl+Z”是“还原/重做”的意思吗？", answer: true }, { qId: 42, qDescription: "在ps中，快捷键“Ctrl+Alt+O”是“打开为”的意思吗？", answer: true }, { qId: 3743, qDescription: "在ps中，快捷键“Ctrl+N”是“新建图形文件”的意思吗？", answer: true }, { qId: 44, qDescription: "在ps中，快捷键“Ctrl+Shift+C”是“合并”的意思吗?", realAnswer: "(不是，是合并拷贝）", answer: false }, { qId: 45, qDescription: "在ps中，快捷键“Ctrl+O”是“打开图像”的意思吗？", realAnswer: "（不是，是打开已有的图像）", answer: false }, { qId: 46, qDescription: "在ps中，快捷键“Ctrl+Shift+F”是“拷贝”的意思吗？ ", realAnswer: "（不是，是淡入/淡出）", answer: false }, { qId: 47, qDescription: "在ps中，快捷键“Ctrl+C”是“剪贴”的意思吗？", realAnswer: "（不是，是拷贝）", answer: false }, { qId: 48, qDescription: "在ps中，快捷键“Ctrl+Q”是“关闭”的意思吗？", realAnswer: "（不是，是退出）", answer: false }, { qId: 49, qDescription: "在ps中，快捷键“Ctrl+W”是“关闭”的意思吗？", answer: true }, { qId: 50, qDescription: "在ps中，快捷键“Ctrl+I”是“反相”的意思吗？", answer: true }, { qId: 51, qDescription: "在ps中，快捷键“Ctrl+R”是“辅助线”的意思吗？", answer: true }, { qId: 52, qDescription: "在ps中，快捷键“Shift+F6”是“羽化”的意思吗？", answer: true }, { qId: 53, qDescription: "在ps中，快捷键“Ctrl+T”是“自由变换”的意思吗？", answer: true }, { qId: 54, qDescription: "在ps中，快捷键“Ctrl+[”是“上移一层的意思”吗?", realAnswer: "(不是，是下移一层）", answer: false }, { qId: 54, qDescription: "在ps中，快捷键“Ctrl+]”是“下移一层”的意思吗？", realAnswer: "（不是，是上移一层）", answer: false }, { qId: 55, qDescription: "在ps中，快捷键“Ctrl+L”是“调整色彩”的意思吗？", realAnswer: "（不是，是调整色阶）", answer: false }, { qId: 56, qDescription: "在ps中，快捷键“Ctrl+B”是“色彩饱和度”的意思吗？", realAnswer: "（不是，是色彩平衡）", answer: false }, { qId: 57, qDescription: "在ps中，快捷键“Ctrl+Shift+S”是保存的意思吗？", realAnswer: "（不是，是另存为）", answer: false }, { qId: 58, qDescription: "在ps中，快捷键“Ctrl+U”是“色相/饱和度”的意思吗？", answer: true }, { qId: 59, qDescription: "在ps中，快捷键“Ctrl+Shift+E”是“合并可见图层”的意思吗？", answer: true }, { qId: 60, qDescription: "在ps中，快捷键“Ctrl+J”是“通过拷贝建立一个图层”的意思吗？", answer: true }, { qId: 61, qDescription: "在ps中，快捷键“Alt+BackSpace”是“加大画笔大小”的意思吗？", answer: true }, { qId: 62, qDescription: "在ps中，快捷键“Ctrl+E”是“向下合并或合并联接图层”的意思吗？", answer: true }, { qId: 63, qDescription: "在ps中，快捷键“Ctrl+Alt+J”是“建立一个图层的”的意思吗？", realAnswer: "（不是，是建立一个通过拷贝的图层）", answer: false }, { qId: 64, qDescription: "在ps中，快捷键“Ctrl+Shift+U”是“调整”的意思吗？", realAnswer: "（不是，是全图调整）", answer: false }, { qId: 65, qDescription: "在ps中，快捷键“Ctrl+Shift+I”是“删除”的意思吗？", realAnswer: "（不是，是反相删除）", answer: false }, { qId: 66, qDescription: "在ps中，快捷键“Ctrl+G”是“填充前景色”的意思吗？", realAnswer: "（不是，是与前一图层编组）", answer: false }, { qId: 67, qDescription: "在ps中，快捷键“Alt+Delete”是“与前一图层编组”的意思吗？", realAnswer: "(不是，是填充前景色）", answer: false }, { qId: 68, qDescription: "在ps中，快捷键“Ctrl+Shift+G”是“取消编组”的意思吗？", answer: true }, { qId: 69, qDescription: "在ps中，快捷键“Ctrl+Delete”是“填充背景色”的意思吗？", answer: true }, { qId: 70, qDescription: "在ps中，快捷键“Ctrl+Shift+P”是“页面设置”的意思吗？", answer: true }, { qId: 71, qDescription: "在ps中，快捷键“Ctrl+K”是“打开“预置”对话框”的意思吗？", answer: true }, { qId: 72, qDescription: "在ps中，快捷键“Ctrl+Alt+D”是“羽化选择”的意思吗？", answer: true }, { qId: 73, qDescription: "在ps中，快捷键“Ctrl+Shift+I”是“选择”的意思吗？", realAnswer: "（不是，是反向选择）", answer: false }, { qId: 74, qDescription: "在ps中，快捷键“Ctrl+V”是“复制”的意思吗吗？", realAnswer: "（不是，是粘贴）", answer: false }, { qId: 75, qDescription: "在ps中，快捷键“Ctrl+X”是“粘贴”的意思吗？", realAnswer: "（不是，是剪贴）", answer: false }];