(function($, base){
    "use strict";
    var XbeiACModel = ["H3C WAC350","H3C WAC360","H3C WAC360V2","H3C WAC361V2","H3C WAC365"];

    base.serverUrl = "https://lvzhouv3.h3c.com/v3";

    base.getCurrentACSN = function (){
        var currentACSN =  plus.storage.getItem("currentACSN");
        if (currentACSN) {
            return currentACSN.toUpperCase();
        } else{
            return "";
        }
    };

    base.setCurrentACSN = function (acSN){
        plus.storage.setItem("currentACSN", acSN);
    };

    base.getCurDevStatus = function(){
        var status =  plus.storage.getItem("curdevstatus");
        if (status) {
            return status;
        } else{
            return "";
        }
    };

    base.setCurDevStatus = function (status){
        if ((status!==null) && (status!==undefined)) {
            plus.storage.setItem("curdevstatus", status.toString());
        }
    };

    base.getLocalACList = function (){
        var devItem = plus.storage.getItem("deviceList");
        if (devItem) {
            return JSON.parse(devItem);
        }
        else{
            return 0;
        }
    };

    base.setLocalACList = function (acList, isSetCurSN){
        var itemKey = "deviceList";
        var acListItem = [];
        if ( acList.length > 0 ){
            for (var i = 0, j = acList.length; i < j; i++) {
                var curDev = acList[i];
                if (curDev.shop_name) {
                    if((!curDev.dev_model||curDev.dev_model==""||curDev.dev_model=="--") ||
                       (curDev.dev_model && XbeiACModel.indexOf(curDev.dev_model.toUpperCase()) != -1)){
                        var ac = {acSN:"", acName:"", placeName:"",valided:"valid"};
                        ac.acSN = curDev.dev_sn.toUpperCase();
                        ac.acName = curDev.dev_name;
                        ac.placeName = curDev.shop_name;
                        acListItem.push(ac);
                    }
                }
            }
            var itemValue = JSON.stringify(acListItem);
            plus.storage.setItem(itemKey, itemValue);

            if (isSetCurSN && (acListItem.length > 0)) {
            	base.setCurrentACSN(acListItem[0].acSN);
            }
        }
        else{
            var itemValue = JSON.stringify(acListItem);
            plus.storage.setItem(itemKey, itemValue);
        }
    };

    base.clearACList = function(){
        plus.storage.removeItem("deviceList");
        plus.storage.removeItem("currentACSN");
    };

    base.timeToString = function(time) {
        var str = "00:00:00";
        if (time) {
            var sec = time % 60 < 10 ? "0" + (time % 60) : (time % 60);
            var min = parseInt(time / 60);
            var hour = parseInt(min / 60);
            var day = parseInt(hour / 24);
            min = min % 60 < 10 ? "0" + (min % 60) : (min % 60);
            hour = hour % 24 < 10 ? "0" + (hour % 24) : hour % 24;
            if(0 != day) {
                str = day + "天";
            }
            else{
                str = hour + ":" + min + ":" + sec;
            }
        }

        return str;
    };
}(mui, window.baseAPI = {}));