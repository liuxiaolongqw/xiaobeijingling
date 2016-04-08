(function($,mui){
	var sub;
	var self;
	var footerPadding;
	var focus = false;
	var title;
	var thisDialogSid;
	var thisDialogType;
	var myUid;
	var sendMsg;
  	var index;
	  	
	var ui = {
		body: document.querySelector('body'),
		footer: document.querySelector('footer'),
		send: document.querySelector('#send'),
		photo: document.querySelector('#photo'),
		btnMsgType: document.querySelector('#msg-type'),
		boxMsgText: document.querySelector('#msg-text'),
		btnMsgImage: document.querySelector('#msg-image'),
		areaMsgList: document.querySelector('#msg-list'),
		h: document.querySelector('#h'),
		content: document.querySelector('.mui-content')
	};
	mui.init({ 		
		beforeback: function(){
   			mui.fire(plus.webview.getWebviewById("chat_dialog.html"),"closeChat",{});
   		}
	})
		
	mui.plusReady(function(){
	 	self = plus.webview.currentWebview();
		self.setStyle({softinputMode: "adjustResize"});
		$("#h").css("width",$("#msg-text").outerWidth()+"px")
		footerPadding = $("footer").outerHeight() - $("#msg-text").outerHeight();
		
		thisDialogSid = self.sid;
		thisDialogType = self.type;
		title = self.title;
		myUid = self.myUid;
		
		$("#title").text(title);
		
		recover();
		mui.fire(plus.webview.getWebviewById("chat_dialog.html"),"openChat",{sid:thisDialogSid});
	})

	$(document).on("tap","#chat_info_link",function(){
  		var path;
  		if(thisDialogType == "mutiple"){
  			path = 'chat_chatgroupinfo.html';
  		}else{
  			path = 'chat_chatsingleinfo.html';
  		}
  		mui.openWindow({
			id:path,
			url:path,
			styles:{
				popGesture:"close"
			},
			show:{
		    	autoShow:true,
		    	aniShow:"slide-in-right"
			},
			waiting:{
				autoShow:true
			},
			extras:{
				sid:thisDialogSid,
				title:title,
				myUid:myUid
			}
		})
  	})
	function makeHtmlStringSelfSay(msg,time,uid){
		var div1 = $(' <div class="chat_msg" align="right" time = "'+time+'"></div>');
		var div2 = $('<div class="chat_arrow_right"></div>');
		var img = $('<img class="chat_headimg"  onerror=this.src="./images/chat/test_xiaozhu.jpg" uid="'+uid+'">');
		var div3 = $('<div class="chat_msg_div_right"></div>');
		var pre = $('<pre class="chat_msg_pre chat_msg_pre_right" align="left"></pre>');
		
  		msg = msgReplaceChatChat(msg);
		pre.text("").append(msg);
//		pre.text(msg);
		div3.append(pre);

		img.attr("src", "../doc/"+uid+".jpg");
		div1.append(div2,img,div3);
		
		return div1;
	}
	function makeHtmlStringOtherSay(name,uid,msg,time){
		var div1 = $('<div class="chat_msg" align="left" time = "'+time+'"></div>')
		var img = $('<img class="chat_headimg" onerror=this.src="./images/chat/test_xiaozhu.jpg" uid="'+uid+'">');
		var pre1 = $('<pre class="chat_name"><pre>');
		var div2 = $('<div class="chat_arrow_left"></div>');
		var div3 = $('<div class="chat_msg_div_left"></div>')
		var pre2 = $('<pre class="chat_msg_pre" align="left"></pre>');
		
		pre1.text(name);
		msg = msgReplaceChatChat(msg);
		pre2.text("").append(msg);
		div3.append(pre2);
		img.attr("src", "../doc/"+uid+".jpg");
		div1.append(img,pre1,div2,div3);
		
		return div1;
	}
	function makeHtmlSystem(msg){
		var div = $('<div class="chat_system"></div>');
		var span = $('<span></span>');
		span.text(msg);
		div.append(span);
		return div;
	}
	function makeHtmlTime(ftime,time){
		var div = $('<div class="chat_time" time="'+time+'"></div>');
		var span = $('<span></span>');
		span.text(ftime);
		div.append(span);
		return div;
	}

	function recoverOtherSay(name,uid,msg,time){
		var os = makeHtmlStringOtherSay(name,uid,msg,time);
		$("#msg-list").append(os);
	}
	
	function recoverSelfSay(msg,time,uid){
		var ss = makeHtmlStringSelfSay(msg,time,uid);
		$("#msg-list").append(ss);
	}
	function recoverSystemSay(msg){
		var ss = makeHtmlSystem(msg);
		$("#msg-list").append(ss);
	}
  	function setMsgDate(date){
        var formatDate = new Date(date).format("yy/MM/dd hh:mm");
        /*框是空的 那么先放一个时间进去*/
        if($("#msg-list").children().length == 0){
            var dateStr = makeHtmlTime(formatDate,date);
            $("#msg-list").append(dateStr);

        }else{
            /*与前一个时间作比较，如果大于2.5分钟再放一个时间*/
            var preDate = $("#msg-list").find("div[class='chat_time']").last().attr("time");
            var oldDate = Date.parse(preDate);
            var newDate = Date.parse(date);
            if(150000<newDate-oldDate){
                var dateStr = makeHtmlTime(formatDate,date);
                $("#msg-list").append(dateStr);
            }
        }
    }
  	
	/*查看更多设置时间*/
    function setMoreMsgDate(date){
        var formatDate = new Date(date).format("yy/MM/dd hh:mm");
        var preDate = $("#msg-list").find("div[class='chat_time']").first().attr("time");
        var firstChirldClass=$("#msg-list").children().first().attr("class");
        //console.log(firstChirldClass);
        var oldDate = Date.parse(preDate);
        var newDate = Date.parse(date);
        //console.log(chatRecoverMsgIndex);
        if((150000<oldDate-newDate) || (index==1)&&("chat_time" != firstChirldClass)){
            var dateStr = makeHtmlTime(formatDate,date);
            $("#msg-list").prepend(dateStr);
        }
    }
        
	function recover(){
		var table = msgRecord+thisDialogSid;
		chatDb.query("select * from '"+table+"' ORDER BY id desc limit 20",function(res){
			var len = res.rows.length;
			for(var i = len; i>0; i--){
				var info = res.rows.item(i-1).info;
				info = JSON.parse(info);
				var msgType = info.msgType;
				var name = info.name;
				var msg = info.msg;
				var time = info.time;
				var uid = info.uid;
				if(!index){
					index = res.rows.item(i-1).id;
				}
				
				/*先放一个时间*/
				setMsgDate(time)
				
				if(msgType == "system"){
					recoverSystemSay(msg);
				}else{
					if(myUid == uid){
						recoverSelfSay(unescape(msg),time,uid);
					}else{
						recoverOtherSay(unescape(name),uid,unescape(msg),time);
					}
				}
			}
			
			$(".chat_msg_pre img").attr("data-preview-src","");
			mui.previewImage();
//			setTimeout(function(){
				scrollToBootom();
//			},100);
			
		})
	}
	
	window.addEventListener('resize', function() {
		scrollToBootom();
	}, false);
	
	function loadMoreMsgRecord(){
		var table = msgRecord+thisDialogSid;
		var a = index-15;
		var b = index-1;
		var s = "select * from '"+table+"' where id between "+ a+" and "+b;

		chatDb.query(s,function(res){
			var len = res.rows.length;
//			console.log("xxxx_"+len);
			
			for(var i=len; i>0; i--){
				var info = res.rows.item(i-1).info;
				info = JSON.parse(info);
				var msgType = info.msgType;
				var name = info.name;
				var msg = info.msg;
				var time = info.time;
				var uid = info.uid;
				index = res.rows.item(i-1).id;
//				console.log(index);
				
				if(msgType == "system"){
					var ss = makeHtmlSystem(msg);
					$("#msg-list").prepend(ss);
				}else{
					if(myUid == uid){
						var ss = makeHtmlStringSelfSay(unescape(msg),time,uid);
						$("#msg-list").prepend(ss);

					}else{
						var os = makeHtmlStringOtherSay(unescape(name),uid,unescape(msg),time);
						$("#msg-list").prepend(os);
					}
				}
				setMoreMsgDate(time);
			}
			
			$(".chat_msg_pre img").attr("data-preview-src","");
			mui.previewImage();
			
			/*回退到滑动前的位置*/
//			console.log("###_old"+scrollHeight);
//			console.log("###_new_"+ui.areaMsgList.scrollHeight);
			var offTop = ui.areaMsgList.scrollHeight - scrollHeight;
//			console.log("##_"+offTop);
			ui.areaMsgList.scrollTop = offTop-5;
		})
			
	}

	var isLoading = false;
	var scrollHeight = 0;
	$("#msg-list").scroll(function(){
//		console.log(ui.areaMsgList.scrollTop);
		if(ui.areaMsgList.scrollTop == 0 && !isLoading){
			if(index == 1){
				return;
			}
			scrollHeight = ui.areaMsgList.scrollHeight;
			isLoading = true;
			$("#msg-list").prepend("<div id='chatDialogLoadMoreContent'><img id='chatDialogLoadMoreJuHua' src='images/login.gif'></div>");
			setTimeout(function(){
				isLoading = false;
				$("#chatDialogLoadMoreContent").remove();
				loadMoreMsgRecord();
			},400)
		}
	})
	
	$(document).on("tap", '#msg-text',function(event){
		$("#msg-text").focus();
			setTimeout(function() {
				$("#msg-text").focus();
			}, 0);
			focus = true;
			setTimeout(function () {
				focus = false;
			},1000);
		event.preventDefault();
	})
	
	$(document).on("input","#msg-text",function(){
		ui.h.innerText = ui.boxMsgText.value.replace(new RegExp('\n', 'gm'), '\n-') || '-';
		ui.footer.style.height = (ui.h.offsetHeight + footerPadding) + 'px';
		ui.content.style.paddingBottom = ui.footer.style.height;
	})
	
	/*点击发送，避免键盘缩回*/
	$(document).on("touchstart","#send",function(){
		msgTextFocus();
		event.preventDefault();
	})
	function sendToServer(msg){
		mui.fire(plus.webview.getWebviewById("chat.html"),"sendMsg",{msg:msg,sid:thisDialogSid,type:thisDialogType});
	}
	
	window.addEventListener("sendMsgResp",function(e){
		plus.nativeUI.closeWaiting();
		if(e.detail.result && e.detail.result == "disconnect"){
			plus.nativeUI.toast("发送失败，请检查网络连接！");
			return false;
		}
		if(e.detail.result && e.detail.result == "unauth"){
			plus.nativeUI.toast("服务器好像出了点问题，请稍候重试！");
			return false;
		}
		if(e.detail.body == "failed"){
			if(e.detail.reason == "Mismactch in group."){
				if(thisDialogType == "couple"){
					plus.nativeUI.toast("您和对方已经不再是好友关系!");
				}else if(thisDialogType == "mutiple"){
					plus.nativeUI.toast("您已经不再是该群成员");
				}
			}else{
				plus.nativeUI.toast("发送失败 reason: "+e.detail.reason);
			}
		}
		if(e.detail.body == "success"){
			$("#msg-text").val("");
			ui.footer.style.height = 51+'px';
			ui.content.style.paddingBottom = ui.footer.style.height;
		}
	})
	window.addEventListener("recvMsg",function(e){
		var sid = e.detail.sid;
		if(sid != thisDialogSid){
			return;
		}
		var sigMsg = e.detail.msg;
		var name = sigMsg.name;
		var msg = sigMsg.msg;
		var time = sigMsg.time;
		var uid = sigMsg.uid;
		setMsgDate(time);
		if(uid && myUid == uid){
			recoverSelfSay(unescape(msg),time,uid);
		}else if(uid){
			recoverOtherSay(unescape(name),uid,unescape(msg),time);
		}else{
			recoverSystemSay(msg);
		}

		$(".chat_msg_pre img").attr("data-preview-src","");
		mui.previewImage();
	
		scrollToBootom();
	})
			
	window.addEventListener("updateGroupTitle",function(e){
		var sid = e.detail.sid;
		var title = e.detail.title;
		if(thisDialogSid == sid){
			$("#title").text(title);
		}
	})

	window.addEventListener("selfLeaveGroup",function(e){
		var sid = e.detail.sid;
		if(thisDialogSid == sid){
			plus.webview.close(self, "none", 0);
		}
	})
	window.addEventListener("close",function(e){
		plus.webview.close(self, "none", 0);
	})
	
	window.addEventListener("cleanMsgRecord",function(e){
		$("#msg-list").children().remove();
	})
	$(document).on("tap","#send",function(){
		sendMsg = $("#msg-text").val();
		sendMsg = sendMsg.trim();
		if(sendMsg == ""){
			$("#msg-text").val("");
			return;
		}

		sendMsg = html2Escape(sendMsg);
		sendToServer(sendMsg);
	})

	//点击消息列表，关闭键盘
	$(document).on("click","#msg-list",function(){
		if(!focus){
			$("#msg-text").blur();
		}
	})
	//滑动消息列表，关闭键盘
	$(document).on("touchmove","#msg-list",function(){
		if(!focus){
			$("#msg-text").blur();
		}
	})

	
	function msgTextFocus() {
		$("#msg-text").focus();
		setTimeout(function() {
			$("#msg-text").focus();
		}, 150);
	}

	function scrollToBootom(){
//		console.log(ui.areaMsgList.scrollHeight)
//		console.log(ui.areaMsgList.offsetHeight)
//		setTimeout(function(){
			ui.areaMsgList.scrollTop = ui.areaMsgList.scrollHeight - ui.areaMsgList.offsetHeight;
//		},200)

	}
	
	$(document).on("tap","#photo",function(){
		if(mui.os.plus){
			var a = [{
				title: "拍照"
			}, {
				title: "从手机相册选择"
			}];
			plus.nativeUI.actionSheet({
				title: "修改头像",
				cancel: "取消",
				buttons: a
			}, function(b) {
				switch (b.index) {
					case 0:
						break;
					case 1:
						getImage();
						break;
					case 2:
						galleryImg();
						break;
					default:
						break
				}
			})	
		}
		
	});
	
	function getImage() {
		var c = plus.camera.getCamera();
		c.captureImage(function(e) {
			plus.io.resolveLocalFileSystemURL(e, function(entry) {
//					sendImg(entry);
				compressImage(entry);
			}, function(e) {
				console.log("读取拍照文件错误：" + e.message);
			});
		}, function(s) {
			console.log("error" + s);
		}, {
			filename: "_doc/send_temp_1.jpg"
		})
	}

	function galleryImg() {
		plus.gallery.pick(function(a) {
			plus.io.resolveLocalFileSystemURL(a, function(entry) {
//					sendImg(entry);
				compressImage(entry);
			}, function(e) {
				console.log("读取拍照文件错误：" + e.message);
			});
		}, function(a) {}, {
			filter: "image"
		})
	};
	
	function compressImage(entry){
		plus.zip.compressImage({
		src:entry.toLocalURL(),
		dst:"_doc/send_temp.jpg",
		quality:50,
		width:'1200px',
		overwrite:true
		},
		function(i){
			plus.io.resolveLocalFileSystemURL("_doc/send_temp.jpg", function(entry) {
				sendImg(entry);
			}, function(e) {
				console.log("读取拍照文件错误：" + e.message);
			});
			console.log("压缩图片成功："+JSON.stringify(i));
		},
		function(){
			console.log("压缩图片失败: "+JSON.stringify(e));
		})
	}
	
	function sendImg(entry){
		bitmap = new plus.nativeObj.Bitmap("sendImg");
		bitmap.load(entry.toLocalURL(),function(){
			var src = bitmap.toBase64Data();
			var image = '<img src="' + src + '">';
			plus.nativeUI.showWaiting();
			sendToServer(image);
		})
	}

})(jQuery,mui)