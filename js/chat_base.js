var isPrint = true;
var msgRecord = "msgRecord_";
function chatLog(info){
	if(isPrint){
		console.log(info);
	}
}
function isEmptyObject(obj){
    for(var n in obj){
    	return false
    }
    return true; 
}
function msgReplaceDialogSum(msg){
	return msg.replace(/\[(em1[0-2][0-9])]/g, "[表情]").replace(/\<img[^>]*>/g,"[图片]");
}
function msgReplaceChatChat(msg){
	return msg.replace(/\[(em1[0-2][0-9])]/g, "<img src=\".\/images/chat\/emotion\/$1.gif\">");
}
function readBlobAsDataURL(blob, callback) {
    var a = new FileReader();
    a.onload = function() {callback(a.result);};
    a.readAsDataURL(blob);
}
function convertHeadImg(img,cback) {
    var image = JSON.parse(img);
    //console.log(image);
    var arr = [];
    for (var i in image) {
        arr[i] = image[i];
    }
    if (arr.length > 0) {
        var ia = new Uint8Array(arr);
        myresizedImage = (new Blob([ia], {type: "image/png"}));
        readBlobAsDataURL(myresizedImage, function (dataurl) {
            //console.log(dataurl);
            cback(dataurl);
        });
    }
}

function calcTime(date){
    var newData = new Date();
    newData.setHours(0);
    newData.setMinutes(0);
    newData.setSeconds(0);
    newData.setMilliseconds(0);

    var milliseconds1Day = 24 * 60 * 60 * 1000;
    var msgT = Date.parse(date);
    var zeroT = Date.parse(newData);
    if(msgT - zeroT >  milliseconds1Day || zeroT - msgT > 6 * milliseconds1Day){
        /*显示具体时间*/
        var formatDate = new Date(date).format("yy/MM/dd");


        return formatDate;
    }else if(msgT - zeroT < milliseconds1Day && msgT - zeroT >0){
        /*显示为今天 */
        var formatDate = new Date(date).format("hh:mm");


        return formatDate;
    }else if(zeroT - msgT < milliseconds1Day && zeroT - msgT >0){
        /*显示为昨天 */

        return "昨天";
    }else{
        /*显示为星期 */
        var dayNames = new Array("星期日","星期一","星期二","星期三","星期四","星期五","星期六");
        var weak = dayNames[new Date(date).getDay()];

        return weak
    }
}
/*时间格式化*/
Date.prototype.format = function(format) {
    var o = {
        "M+" : this.getMonth()+1, //month
        "d+" : this.getDate(), //day
        "h+" : this.getHours(), //hour
        "m+" : this.getMinutes(), //minute
        "s+" : this.getSeconds(), //second
        "q+" : Math.floor((this.getMonth()+3)/3), //quarter
        "S" : this.getMilliseconds() //millisecond
    }
    if(/(y+)/.test(format))
        format=format.replace(RegExp.$1,(this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(format))
            format = format.replace(RegExp.$1,RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
    return format;
}

function cleanBadge(el){
	el.text(0);
	el.css("display","none");
}
function setBadgeAddOne(el){
	if("none" == el.css("display")){
		el.css("display","block");
	}
	var old = el.text();

	old = parseInt(old);
	el.text(old+1);
	
}
function setBadgeDecOne(el){
	var old = el.text();
	if(old==0){
		return;
	}
	old--;
	if(old!=0){
		el.text(old);
	}else{
		el.text(0);
	}
}
function setBadge(el,a){
	el.text(a);
	if(a!=0){
		el.css("display","block");
	}else{
		el.css("display","none");
	}
}

function html2Escape(sHtml) {
 	return sHtml.replace(/[<>&"]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];});
}

var isBeeping = false;
function fbeep(currentSidFlag,beep,vibrate){
	if(isBeeping == true){
		return;
	}
	isBeeping = true;

	if(plus.os.name == "iOS"){
		if(currentSidFlag && currentSidFlag==true){
			if(beep && vibrate){
//				plus.ios.invoke(null,"AudioServicesPlaySystemSound", 1003);
				$("#chatMsgSoundInfo")[0].play();
				plus.device.vibrate();
			}
			if(!beep && vibrate){
				plus.device.vibrate();
			}
			if(beep && !vibrate){
//				plus.ios.invoke(null,"AudioServicesPlaySystemSound", 1003);
				$("#chatMsgSoundInfo")[0].play();
			}
		}else{
			if(beep && vibrate){
//				plus.ios.invoke(null,"AudioServicesPlaySystemSound", 1002);
				$("#chatMsgSoundInfo")[0].play();
				plus.device.vibrate();
			}
			if(!beep && vibrate){
				plus.device.vibrate();
			}
			if(beep && !vibrate){
//				plus.ios.invoke(null,"AudioServicesPlaySystemSound", 1002);
				$("#chatMsgSoundInfo")[0].play();
			}
		}
		//	plus.ios.invoke(null,"AudioServicesPlaySystemSound", 1002);//咚隆咚+震动一下
		//	plus.ios.invoke(null,"AudioServicesPlaySystemSound", 1003);//呜下
		//	plus.ios.invoke(null,"AudioServicesPlaySystemSound", 1004);//呜上
		//	plus.ios.invoke(null,"AudioServicesPlaySystemSound", 1011);//震动两下
		//	plus.ios.invoke(null,"AudioServicesPlaySystemSound", 1007)//咚隆咚+震动两下
		//	plus.ios.invoke(null,"AudioServicesPlaySystemSound", 1034);
			
	}else{
		if(beep && vibrate){
			$("#chatMsgSoundInfo")[0].play();
			plus.device.vibrate();
		}
		if(!beep && vibrate){
			plus.device.vibrate();
		}
		if(beep && !vibrate){
			$("#chatMsgSoundInfo")[0].play();
		}
	}
	setTimeout(function(){
		isBeeping = false;
	},1200)
}

/*将BASE 64保存为文件*/
function saveHeadImgFile(uid,base64,quality,cback){
	var bitmap = new plus.nativeObj.Bitmap("test");
	// 从本地加载Bitmap图片
	bitmap.loadBase64Data(base64,function(){
		console.log('加载图片成功');
		bitmap.save( "_doc/"+uid+".jpg",{overwrite:true,quality:quality},function(i){
			cback();
			console.log('保存图片成功：'+JSON.stringify(i));
		},function(e){
			console.log('保存图片失败：'+JSON.stringify(e));
		});
	},function(e){
		console.log('加载图片失败：'+JSON.stringify(e));
	});
}
