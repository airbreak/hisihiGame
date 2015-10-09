$(function () {
    game.initialize();
});

/*游戏对象*/
var game = {
    $cWrapper: null,
    $gWrapper: null,
    timeInterval: null,
    questionsArr: [{ qId: 1, qDescription: '在ps中，ctrl+v是复制的快捷键对么？', a: true }, { qId: 2, qDescription: '在ps中，ctrl+v是复制的快捷键对么？', a: true },
        { qId: 3, qDescription: '在ps中，ctrl+j是复制l图层的快捷键对么？', a: true }, { qId: 4, qDescription: '在ps中，ctrl+b是取消选区的快捷键对么？', a: false },
        { qId: 5, qDescription: '在ps中，p是快速蒙板的快捷键对么？', a: true }, { qId: 6, qDescription: '在ps中，ctrl+i是反向选择的快捷键对么？', a: true },
        { qId: 7, qDescription: '在ps中，ctrl+t是标尺的快捷键对么？', a: true }, { qId: 8, qDescription: '在ps中，b是的画笔的快捷键对么？', a: true },
        { qId: 9, qDescription: '在ps中，ctrl+r是自由绽放的快捷键对么？', a: false }, { qId: 10, qDescription: '在ps中，g是复制的快捷键对么？', a: false }
    ],
    answersArr:[],

    /**初始化游戏**/
    initialize: function () {
        this.$cWrapper = $('.contentWrapper');
        this.$gWrapper = $('.gameContentWrapper');
        this.eventsInit();
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
                $btns.hide();
                $('.gameRecords').show();
            }
            that.showGameContentWrapper();
            
        });

        /*关闭记录*/
        $recorders.on('click', '.closeGameRecords', function () {
            $btns.show();
            $recorders.hide();
        });

        /*题目答案选择*/
        that.$gWrapper.on('click', '.gameContentBtns>div', function () {
            var $q=that.$gWrapper.find('.gameContentQuestion'),
                  qid=$q.attr('data-qid'),  //当前题号
                  currentAnswer = !$(this).index();//当前题号的答案

            //保存所回答问题
            that.answersArr.push({
                qid: qid,
                answer:currentAnswer
            });
            that.fillInQuestionToDom();   //随机出题
        });
    },

    /*
    *开始游戏
    *需要执行以下过程：1.从服务器取题库；2.随机从得到的题中选择一题；3.开始计时
    */
    showGameContentWrapper: function (imgSrc) {
        this.$cWrapper.hide();
        $('.gameContentWrapper').addClass('gameContentWrapperShow');
        this.getQuestionsFromService(function (data) {
            this.questionsArr = data;
            this.fillInQuestionToDom();   //随机出题
            this.setTimeOutInfo();
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

    /*填充问题内容*/
    fillInQuestionToDom: function () {
        var $q = this.$gWrapper.find('.gameContentQuestion'),
              oQId = $q.attr('data-qid'),
             qInfo = this.showQuestionByRandom(oQId);
        $q.attr('data-qid', qInfo.qId);
        $q.find('p').text(qInfo.qDescription);
    },

    /*随机出题*/
    showQuestionByRandom: function (oQId) {
        var index = Math.random() * this.questionsArr.length;
        index = Math.round(index);
        var qIf = this.questionsArr[index];
        if (qIf && oQId != qIf.qId) {
            return qIf;
        } else {
            return this.showQuestionByRandom(oQId);
        }
    },

    /*设置计时器*/
    setTimeOutInfo: function () {
        var that = this;
        var $timeLabel = this.$gWrapper.find('.timeDetailInfo');
        this.timeInterval = window.setInterval(function () {
            that.updateTimeShowInfo.call(that, $timeLabel);
        }, 1000);
    },

    /*更新显示出来的时间*/
    updateTimeShowInfo: function ($label) {
        var num = $label.text().split(':')[2] | 0;
        if (num == 0) {
            num=('00:00:00');
            this.gameOver();
        } else {
            num--;
            if (num < 10) {
                num = '0' + num;
            }
            num = '00:00:' + num;
            $label.text(num);
        }
    },

    /*游戏结束*/
    gameOver: function () {
        console.log('时间到！');
        window.clearInterval(this.timeInterval);
        $.each(this.answersArr,function () {
           this
        });
    },

    /*游戏得分计算*/
    calculateScroes: function () {
         
    },

    OBJECT_NAME: 'game'
};

/*angularjs 数据绑定*/
var app = angular.module('myApp', []);
app.controller('gameRecordsController', function ($scope, $http) {
    var data = [{ name: '神级设计尸', date: '2015.9.28', scores: '45665分' }, { name: '新东方厨师', date: '2015.9.28', scores: 42665 },
        { name: '千年老尸', date: '2015.9.28', scores: 40665 }, { name: '苍老师', date: '2015.9.28', scores: 35665 },
        { name: '撸大湿', date: '2015.9.28', scores: 25665 }, { name: '村口王师傅', date: '2015.9.28', scores: 15665 }];
    $scope.items = data;
    //$http({
    //    method: 'POST',
    //    url: '/Shop/Products',
    //    data: { fileInfo: 'dds' },
    //    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },

    //}).success(function (data) {
    //    data = JSON.parse(data);
    //    $scope.items = data;
    //}).error(function () {
    //    alert('error');
    //});
});