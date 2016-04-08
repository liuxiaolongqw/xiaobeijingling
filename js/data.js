(function($, dataAPI){
    var cloudUrl= "https://lvzhouv3.h3c.com/v3";

    dataAPI.getUserACList = function (username, callBack){
        var reqData = {"tenant_name":username, "dev_snlist":[]};
        $.ajax({
            url: cloudUrl + '/ace/o2oportal/getDeviceInfo',
            type: 'post',
            username: "security_super",
            password: "lvzhou1-super",
            data: JSON.stringify(reqData),
            contentType:'application/json; charset=utf-8',//指定POST提交的数据类型
            dataType:'json',
            success: function(data,status,xhr){
                if(status == 'success'){
                    var err=0;
                    var acList = data.dev_list;
                    callBack(acList, err);
                }
            },
            error: function(XMLHttpRequest, textStatus ,err){
                var err = 99;
                callBack("",err);
            }
        });
    }

    dataAPI.getDevStatus = function (username, devSN, callBack){
        var reqData = {"tenant_name":username, "dev_snlist":[devSN]};
        $.ajax({
            url: cloudUrl + '/ace/o2oportal/getDevStatus',
            type: 'post',
            username: "security_super",
            password: "lvzhou1-super",
            data: JSON.stringify(reqData),
            contentType:'application/json; charset=utf-8',//指定POST提交的数据类型
            dataType:'json',
            success: function(data,status,xhr){
                if(status == 'success'){
                    var err=0;
                    var devStatusList = data.dev_statuslist;
                    callBack(err, devStatusList);
                }
            },
            error: function(XMLHttpRequest, textStatus ,err){
                var err = 99;
                callBack(err,"");
            }
        });
    }

    dataAPI.getAPStatistic = function (devSN, callback) {
        var err = 0;
        $.ajax({
            url: cloudUrl + '/apmonitor/app/apstatistic?devSN=' + devSN,
            type: 'get',
            dataType:'json',
            timeout: 5000,
            success: function(data,status){
                if(status == 'success'){
                    err = 0;
                    callback(data,err);
                }
            },
            error: function(data,errcode){
                err = 1;
                var errMsg = "请求AP统计信息失败";
                callback(errMsg,err);
            }
        });
    };

    dataAPI.getClientStatistic = function (devSN, callback) {
        var err = 0;
        $.ajax({
            url: cloudUrl + '/stamonitor/app/clientstatistic?devSN=' + devSN,
            type: 'get',
            dataType:'json',
            timeout: 5000,
            success: function(data,status){
                if(status == 'success'){
                    err = 0;
                    callback(data,err);
                }
            },
            error: function(data,errcode){
                err = 1;
                var errMsg = "请求终端统计信息失败";
                callback(errMsg,err);
            }
        });
    };

    dataAPI.getWanSpeed = function (devSN, callback) {

        var err = 0;
        $.ajax({
            url: cloudUrl + '/devmonitor/app/wanspeed?devSN=' + devSN,
            type: 'get',
            dataType:'json',
            timeout: 5000,
            success: function(data,status){
                if(status == 'success'){
                    err = 0;
                    callback(data,err);
                }
            },
            error: function(data,errcode){
                err = 1;
                var errMsg = "请求Wan口速率失败";
                callback(errMsg,err);
            }
        });
    };

    dataAPI.getSecureData = function (acSn, callback) {
        var para = {
            Method:'GetRogueAp',
            Param:{
                ACSN: acSn
            },
            Return:[
                "APName",
                "MacAddress",
                "SeverityLevel"
            ]
        };

        $.ajax({
            url: cloudUrl+'/ant/wips_ap',
            type: "post",
            dataType:'json',
            data: para,
            timeout: 5000,
            success:function(result) {
                err = 0;
                callback(result,err);
            },
            error:function(result){
                err = 1;
                callback(result,err);
            }
        });
    }

    /* 私接代理 */
    dataAPI.getPrivateNatList = function(acSn, callback) {
        var para = {
            Method:'GetClient',
            Param:{
                    ACSN: acSn
                  },
            Return:[
                "APName",
                "ClientMAC",
                "FirstTime",
                "LastTime",
                "DetectTimes",
                "OSVersion"
            ]
        };

        $.ajax({
            url:cloudUrl+"/ant/nat_detect",
            type:"post",
            data: para,
            dataType:"json",
            timeout: 5000,
            success:function(adoc){
                //alert("success:" + JSON.stringify(adoc));
                var result = [];
                for (var i in adoc) {
                    result.push({
                        ClientMAC:adoc[i].ClientMAC,
                        FirstTime:adoc[i].FirstTime,
                        LastTime:adoc[i].LastTime,
                        DetectTimes:adoc[i].DetectTimes,
                        OSVersion:adoc[i].OSVersion,
                        APName:adoc[i].APName
                    });
                }
                callback && callback(result, 0);
            },
            error:function(err){
                //alert("error:" + JSON.stringify(err));
                callback && callback(err, 1);
            }
        });
    }

    dataAPI.getClientInfo = function (acSN, clientMAC, callback){
        $.ajax({
            url: cloudUrl + '/stamonitor/app/stainfo?devSN=' + acSN + '&clientMAC=' + clientMAC,
            type: 'get',
            dataType:'json',
            timeout: 5000,
            success: function (data, status) {
                err = 0;
                callback(data.clientInfo, err);
            },
            error: function(data, err){
                err = 1;
                callback(data, err);
            }
        });
    }

    dataAPI.getAPGroups = function (devSN, startNum, callback) {
        var err = 0;
        var sendData = {"devSN":devSN, "startNum":startNum};
        $.ajax({
            url: cloudUrl + '/apmonitor/app/apgrplist',
            type: 'get',
            data: sendData,
            dataType:'json',
            timeout: 5000,
            success: function(data,status){
                if(status == 'success'){
                    err = 0;
                    callback(data.apgrpList,err);
                }
            },
            error: function(data,errcode){
                err = 1;
                callback(data,err);
            }
        });
    }

    dataAPI.getAPGroupMembers = function (devSN, APGroup, configType, startNum, callback){
        var err = 0;
        var subUrl = "/apmonitor/app/apgrp/seriallist";
        if (configType == 1) {
            subUrl = "/apmonitor/app/apgrp/seriallist";
        }
        else if (configType == 2) {
            subUrl = "/apmonitor/app/apgrp/maclist";
        }
        var sendData = {"devSN":devSN, "grpName": APGroup, "startNum":startNum};
        $.ajax({
            url: cloudUrl + subUrl,
            type: 'get',
            data: sendData,
            dataType:'json',
            timeout: 5000,
            success: function(data,status){
                if(status == 'success'){
                    err = 0;
                    if (configType == 1) {
                        callback(data.serialList,err);
                    }
                    else if (configType == 2) {
                        callback(data.macList,err);
                    }
                }
            },
            error: function(data,errcode){
                err = 1;
                callback(data,err);
            }
        });
    }

    dataAPI.addAPGroupMember = function (devSN, APGroup, optType, apId, callback){
        var err = 0;
        var sendData = {"devSN":devSN, "configType":0, "cloudModule": "apmgr", "deviceModule":"apmgr",
            "method":"AddApToGroup", "param":[{"apGroupName" : APGroup, "optType": optType, "info":apId}]};
        $.ajax({
            url: cloudUrl + '/ant/confmgr',
            type: 'post',
            data: sendData,//JSON.stringify(sendData),
            //contentType:'application/json; charset=utf-8',
            dataType:'json',
            timeout: 5000,
            success: function(data,status){
                if(status == 'success'){
                    err = 0;
                    callback(data, err);
                }
            },
            error: function(data,errcode){
                errCode = 99;
                callback(data, errCode);
            }
        });
    }

    dataAPI.delAPGroupMember = function (devSN, APGroup, optType, apId, callback){
        var err = 0;
        var sendData = {"devSN":devSN, "configType":0, "cloudModule": "apmgr", "deviceModule":"apmgr",
            "method":"DelApToGroup", "param":[{"apGroupName" : APGroup, "optType": optType, "info":apId}]};
        $.ajax({
            url: cloudUrl + '/ant/confmgr',
            type: 'post',
            data: sendData,//JSON.stringify(sendData),
            //contentType:'application/json; charset=utf-8',
            dataType:'json',
            timeout: 5000,
            success: function(data,status){
                if(status == 'success'){
                    err = 0;
                    callback(data, err);
                }
            },
            error: function(data,errcode){
                errCode = 99;
                callback(data, errCode);
            }
        });
    }
    
    dataAPI.getTenantName = function (callback){

        $.ajax({
            url: cloudUrl + '/web/cas_session?refresh='+Math.random(),
            type: 'get',
            //dataType:'json',
            timeout: 10000,
            success: function(data){
                err = 0;
                callback(data,err);
            },
            error: function(data,errcode){
                err = 1;
                callback(data,err);
            }
        });
    }
}(mui, window.dataAPI = {}));