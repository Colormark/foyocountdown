;(function($) {

	var FoyoCountdown = function(ele, opt) {
        this.$element = ele;
        this.defaults = {
        	   'type': 'line', // line || circle
            'debug': false,
            'lineWidth': 1, //
            'lineTextColor': '#555',
            'lineWidthOnDone' : 1,
            'lineTextColorWidthOnDone' :'#555',
            'backgroundColor':"#DDD",
                'direction': 'start', // start || end
            'textColor': '#888',
            'textSize': '10px',
            'interval': 500,
            'showShadow': false,
            'hideMark': false,
            'lblDay': '天',
            'lblHour': '时',
            'lblMinute': '分',
            'lblSecond': '秒',
            'tipOnCouted': '<i class="iconfont" style="color:green">&#xe65e;</i>',
            'colorOnCouted':'#0F0'
        };
        this.options = $.extend({}, this.defaults, opt);
        this.elapsed = 0; //已经花去时间，毫秒
        this.estimated = 0; //预计耗时，毫秒
        this.line = null;
        this.icon = null;
        this.textLabel = null;
        this.timeLabel = null;
        this.timer = null;
        this.passedGapTime = 0;
        this.debug=false;
        this.currentZone = null;
    };

    FoyoCountdown.prototype = {
        "init": function() {

            this.debug = this.options["debug"];

        	var ele = this.$element;
        	ele.addClass("foyocountdown-container");
            ele.data("foyocountdown", this);

            this.line = $('<div class="foyocountdown-line"><span class="foyocountdown-shine"></span></div>');
            ele.append(this.line);

            this.icon = $('<div class="foyocountdown-icon"></div>');
            ele.append(this.icon);
            this.hideIcon();

            this.textLabel = $('<div class="foyocountdown-textlabel"></div>');
            ele.append(this.textLabel);

            this.timeLabel = $('<div class="foyocountdown-timelabel"></div>');
            ele.append(this.timeLabel);

            if(typeof this.options["icon"] !== "undefined" || this.options["icon"]!=null){
                this.setIcon(this.options["icon"]);
            }

            if(typeof this.options["startTime"] === "undefined" || this.options["startTime"]==null){
                throw new Error("Unset startTime");
                return;
            }

            if(typeof this.options["currentTime"] === "undefined" || this.options["currentTime"]==null){
                throw new Error("Unset currentTime");
                return;
            }

            this.elapsed= this.options["currentTime"] - this.options["startTime"];         

            var timezone = this.options["timezone"];

            var estimatedSecond= 0;

            for(var i=0; i<timezone.length;i++){
                estimatedSecond = estimatedSecond + timezone[i]["second"];
            }
            this.estimated = estimatedSecond*1000;

            if(Object.prototype.toString.call(this.options["timezone"]) !== "[object Array]"){
                throw new Error("Unset timezone or not an array");
                return;
            }else{
                var tz = this.options["timezone"];
                for(var i = tz.length-1 ; i >= 0; i--){
                    var tzTimezone = 0;
                    for(var j = tz.length-1 ; j >= 0; j--){
                        if(j>=i){
                            tzTimezone = tzTimezone + tz[j]["second"];
                        }
                    }
                    tz[i]["tzSecond"] = tzTimezone;
                    tz[i]["zoneType"] = "process";

                    var flag = $('<div class="foyocountdown-flag"></div>');
                    flag.width((tzTimezone*1000/this.estimated)*100+"%");
                    ele.append(flag);
                }
            }

            var flag = $('<div class="foyocountdown-flag"></div>');
            flag.width("0%");
            ele.append(flag);

            if(this.options["hideMark"]){
                this.hideMark();
            }

            if(Object.prototype.toString.call(this.options["overduezone"]) === "[object Object]"){
                this.options["overduezone"]["zoneType"] = "overdue";
            }

            if(Object.prototype.toString.call(this.options["donezone"]) === "[object Object]"){
                this.options["donezone"]["zoneType"] = "done";
                this.frozen(this.options["donezone"]);
            }else{
                this.setProgress();
                this.timer = window.setInterval(this.bind(this,this.timeRun), this.options["interval"]);
            }

        },
        "setIcon":function(icon){
            this.icon.show("fast");
            this.icon.html(icon);
        },
        "hideIcon":function(){
            this.icon.hide();
        },
        "hideMark":function(){
            this.$element.find(".foyocountdown-flag").hide();
        },
        "bind": function(object, func) {  
            return function() {  
                return func.apply(object, arguments);  
            }  
        },
        "timeRun": function(){
            this.elapsed += this.options["interval"];
            this.setProgress();
        },
        "stop":function(){
            if(this.timer!=null){
                window.clearInterval(this.timer);
                this.timer = null;
            }
        },
        "setProgress": function(){


            var zoneData = this.getCurrentZone();

            if(Object.prototype.toString.call(zoneData) === "[object Object]"){

                if(zoneData["zoneType"]=="process"){ // countdown
                    var per = this.elapsed/this.estimated;
                    this.line.width((1-per)*100+"%");
                    this.setTimeLabel(this.estimated-this.elapsed);

                    this.setProgressDownEffect(zoneData);
                }else if(zoneData["zoneType"]=="overdue"){ //overdue

                    this.line.width("100%");
                    this.line.css("backgroundColor", this.options["overduezone"]["color"]);
                    this.setTimeLabel(this.elapsed-this.estimated);
                    this.textLabel.text(this.options["overduezone"]["label"]);


                }else if(zoneData["zoneType"]=="counted"){ //counted

                    
                    this.line.width(0);

                    if(Object.prototype.toString.call(this.options["onCounted"]) === "[object Function]"){
                        this.options["onCounted"](this.$element, this);
                    }

                    this.stop();

                }else if(zoneData["zoneType"]=="done"){ //done

                    var per = this.elapsed/this.estimated;
                    this.line.width((1-per)*100+"%");
                    this.setTimeLabel(this.elapsed);

                    this.setProgressDownEffect(zoneData);

                    this.stop();
                }

            }

        },
        "setProgressDownEffect": function(zoneData){

            if(typeof zoneData["isset"] === "undefined" || zoneData["isset"]!=1){

                this.line.css("backgroundColor",zoneData["color"]);
                this.line.height(this.options["lineWidth"]);
                this.textLabel.css("color", this.options["lineTextColor"]);

                this.textLabel.text(zoneData["label"]);
                if(this.options["showShadow"]){
                    this.line.css("boxShadow","0px 1px 2px "+zoneData["color"]);
                }

                zoneData["isset"] = 1;

                if(Object.prototype.toString.call(this.options["onZoneChange"]) === "[object Function]"){
                    this.options["onZoneChange"](zoneData);
                }

                return;
            }

        },
        "frozen": function(donezone){

            this.elapsed=donezone["doneTime"]-this.options["startTime"];

            this.line.height(this.options["lineWidthOnDone"]);
            this.hideShadow();

            this.textLabel.css("color", this.options["lineTextColorWidthOnDone"]);
            
            var per = this.elapsed/this.estimated;
            this.line.width((1-per)*100+"%");

            this.textLabel.text(donezone["label"]);
            this.setTimeLabel(this.elapsed);

            if(typeof donezone["icon"] !== "undefined"){
                this.setIcon(donezone["icon"]);
            }

            var itemData = this.getCurrentZone();
            if(Object.prototype.toString.call(itemData) === "[object Object]"){
                if(!(typeof itemData["isset"] !== "undefined" && itemData["isset"]==1)){
                    this.line.css("backgroundColor",itemData["color"]);
                }
            }else{
                console.log("Unknown Error on getCurrentZone()");
            }

            if(this.elapsed>this.estimated && Object.prototype.toString.call(this.options["overduezone"]) === "[object Object]"){

                this.line.width("100%");
                this.line.css("backgroundColor", this.options["overduezone"]["color"]);

            }

            this.stop();
            
        },
        "getCurrentZone": function(){
            if(this.elapsed<this.estimated){
                for(var i=this.options["timezone"].length-1; i >= 0; i--){
                    var itemData = this.options["timezone"][i];
                    if((this.estimated-this.elapsed)<itemData["tzSecond"]*1000){
                        return itemData;
                    }
                }
            }else{
                if(Object.prototype.toString.call(this.options["overduezone"]) === "[object Object]"){
                    return this.options["overduezone"];
                }else{
                    var zone = {
                        'zoneType':'counted',
                        'label':this.options["tipOnCouted"],
                        'color':this.options["colorOnCouted"]
                    }
                    return zone;
                }
            }
        },
        "hideShadow":function(){
            this.line.css("boxShadow","none");
        },
        "setTimeLabel":function(mss){   
            var days = parseInt(mss / (1000 * 60 * 60 * 24));
            var hours = parseInt((mss % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = parseInt((mss % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = parseInt((mss % (1000 * 60)) / 1000);

            var formatTime = "";
            if(days>0){
                formatTime = days +this.options["lblDay"]+ hours + this.options["lblHour"];
            }else{
                if(hours>0){
                    formatTime = hours + this.options["lblHour"] + minutes +this.options["lblMinute"] + seconds + this.options["lblSecond"];
                }else{
                    formatTime = minutes + this.options["lblMinute"] + seconds + this.options["lblSecond"];
                }
            }

            this.timeLabel.text(formatTime);

        },
        "compare": function (property){
            return function(a,b){
                var value1 = a[property];
                var value2 = b[property];
                return value1 - value2;
            }
        }

    };

    $.fn.foyocountdown = function(options) {
        var foyocountdown = new FoyoCountdown(this, options);
        return foyocountdown.init();
    }

    $.fn.foyocountdownSetIcon = function(icon) {
        var foyocountdown = $(this).data("foyocountdown");
        foyocountdown.setIcon(icon);
    }

    $.fn.foyocountdownFrozen = function(donezone) {
        var foyocountdown = $(this).data("foyocountdown");
        foyocountdown.frozen(donezone);
    }
    

})(jQuery);

