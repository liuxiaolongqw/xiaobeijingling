
(function($,mui){
	var activeTab;
	var self;
	var socket=null;
	var session_id;
	var myuid;
	var myName;
	var mypid;
	var db;
	var authState = false;
	var ofStamp;
	var ogStamp;
	var nfStamp;
	var ngStamp;
	var isRcvIng = false;

	var page = {};
	
	var cState = {
		setStateConnecting:function(){
	    	$("#title").hide();
	    	$("#connecting img").show();
	    	$("#connecting span").text("正在连接...");
	    	$("#connecting").show();
		},
		setStateAuth:function(){
			$("#title").hide();
			$("#connecting img").show();
	    	$("#connecting span").text("正在认证...");
	    	$("#connecting").show();
		},
		setStateAuthFailed:function(){
			$("#title").hide();
			$("#connecting img").hide();
	    	$("#connecting span").text("认证失败!");
	    	$("#connecting").show();
		},
		setStateRecv:function(){
		    $("#title").hide();
		    $("#connecting img").show();
	    	$("#connecting span").text("正在收取...");
	    	$("#connecting").show();
		},
		setStateConnectDown:function(){
		   	$("#title").hide();
		   	$("#connecting img").hide();
	    	$("#connecting span").text("连接断开!");
	    	$("#connecting").show();
		},
		setStateConnectFailed:function(){
			$("#title").hide();
			$("#connecting img").hide();
	    	$("#connecting span").text("连接失败!");
	    	$("#connecting").show();
		},
		setStateReConnecting:function(){
			$("#title").hide();
			$("#connecting img").show();
	    	$("#connecting span").text("正在重连...");
	    	$("#connecting").show();
		},
		clean:function(){
			$("#connecting").hide();
			$("#title").show();
		}
	}
   	mui.init({
 
   	});
   	mui.ready(function(){
		
   	})
    mui.plusReady(function(){
		/*创建表*/
    	createTableIfNotExist();
    	
		var subpages = ['chat_dialog.html', 'chat_contact.html', 'chat_me.html'];
		var subpage_style = {
			top: '45px',
			bottom: '51px',
			bounce:"vertical",
			bounceBackground:"#ffffff",
// 			hardwareAccelerated:true
		};

		//当前激活选项
		activeTab = subpages[0];
		
		var title = document.getElementById("title");
		
    	self = plus.webview.currentWebview();
		for (var i = 0; i < 3; i++) {
			var temp = {};
			var sub = plus.webview.create(subpages[i], subpages[i], subpage_style);
		
			if(subpages[i] == "chat_dialog.html"){
				page.dialog = sub;
			}else if(subpages[i] =="chat_contact.html"){
				page.contact = sub;
			}else if(subpages[i] =="chat_me.html"){
				page.me = sub;
			}
			
			if (i >0) {
				sub.hide();
			}
			self.append(sub);
		}
		
		var spd = false;
		var spc = false;
		var spm = false;
		
		function subPageLoadedProc(){
			if(spd && spc && spm){
				recoverSelfInfo();
				document.addEventListener( "resume", function(){
					setIndexChatBadge();
				})
			}
		}
		page.dialog.addEventListener("loaded",function(e){
			spd = true;
			subPageLoadedProc();
		})
		
		page.me.addEventListener("loaded",function(e){
			spm = true;
			subPageLoadedProc();
		})
		
		page.contact.addEventListener("loaded",function(e){
			spc = true;
			subPageLoadedProc();
    	})

		//当点击主页面上任何一个链接都通知子页面把POPVIEW关掉
		$(document).on("tap","a",function(){
			
			/*处理点击加号出现的popview*/
			if($(this).attr("id") != "addLink"){
				var children = self.children();
				for(var i in children){
					mui.fire(children[i],"hidePopView");
				}
			}
			
			mui.fire(page.dialog,"hidePopView_deleteDialog");
		})
    })
    
    /*切换选项卡函数，为什么要写这么一个函数呢，是因为需要配合聊天页面返回流程*/
	function changeTab(a){
		var targetTab = $(a).attr('href');
		if (targetTab == activeTab) {
			return;
		}
		//更换标题
		title.innerHTML = $(a).find('.mui-tab-label').text();
		
		//显示目标选项卡
		plus.webview.show(targetTab);
		
		//隐藏当前;
		plus.webview.hide(activeTab);
		
		//更改当前活跃的选项卡
		activeTab = targetTab;
	}
	//选项卡点击事件
	mui('.mui-bar-tab').on('tap', 'a', function(e) {
		changeTab("#"+$(this).attr("id"));
	});
	
	window.addEventListener('changToIndex',function(event){

		title.innerHTML = "会话";
		$("#contact").removeClass("mui-active");
		$("#dialog").addClass("mui-active");
		
		/*为什么不发事件呢？是因为发事件有毛病，mui-active加不上*/
		changeTab("#dialog");
	});
	window.addEventListener('logout',function(event){
		for(var i in page){
			plus.webview.close(page[i], "none", 0);
		}
		plus.webview.close(plus.webview.getWebviewById("chat_group.html"),"none",0);
		plus.webview.close(self, "none", 0);
		
	});
	window.addEventListener("addLinkResp",function(event){
		 var href = event.detail;
		 mui.openWindow({
			id:href,
			url:href,
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
				myuid:myuid
			}
		})
	})
	/*********************************find user页面相关 开始**************************************/
	window.addEventListener("findUser",function(e){
		var name = e.detail.name;
		var resp = {};
		if(!makeNetworkStateResp(resp)){
			mui.fire(plus.webview.getWebviewById("chat_finduser.html"),"findUserResp",resp);
			return ;
		}
	 	socket.emit("findUsers",{keyword:escape(name),startNum:0},function(data){
		    console.log("findUsers_"+JSON.stringify(data));
		    if(data["result"] == "success"){
		    	resp.body = data["body"];
		    	mui.fire(plus.webview.getWebviewById("chat_finduser.html"),"findUserResp",resp);
		    }else{
		    	console.log("ERROR fined user from server failed");
		    }
		})
	})
	window.addEventListener("findUserHeadImg",function(e){
		var uid = e.detail.uid;
	 	 socket.emit("userPhotoGet", {uid:uid},function(data){
            if(data["result"]=="success" && data["body"] && data["body"]["image"]){
                mui.fire(plus.webview.getWebviewById("chat_finduser.html"),"findUserHeadImgResp",{img:data["body"]["image"],uid:uid});
            }
        })
	})
	window.addEventListener("addUser",function(e){
		var uid = e.detail.uid;
		var name = e.detail.name;
		var resp = {};
		if(!makeNetworkStateResp(resp)){
			mui.fire(plus.webview.getWebviewById("chat_finduser.html"),"addUserResp",resp);
			return ;
		}
		socket.emit("friendAdd",{fname:escape(name), uid:uid}, function(data){
			if(data["result"] == "success"){
				resp.uid = uid;
				mui.fire(plus.webview.getWebviewById("chat_finduser.html"),"addUserResp",resp);
			}else{
				console.log("ERROR add user failed");
			}
		})
	})
	window.addEventListener("sendMsg",function(e){
		var sid = e.detail.sid;
		var type = e.detail.type;
		var msg = e.detail.msg;
		
		var resp = {};
		if(!makeNetworkStateResp(resp)){
			mui.fire(plus.webview.getWebviewById("chat_chat.html"),"sendMsgResp",resp);
			return ;
		}
		
		socket.emit("message",{msg:escape(msg),oprSn:0,sid:sid,type:type},function(data){
			if(data["result"]=="success"){
				resp.body = data["body"];
				var time = data["body"]["time"];
				var mid = data["body"]["mid"];
				resp.body = "success";
				mui.fire(plus.webview.getWebviewById("chat_chat.html"),"sendMsgResp",resp);
				
				/*模拟接收到一个消息发给DIALOG页面进行处理*/
				var b = {};
				b.mid = mid;
				b.uid = myuid;
				b.name = myName;
				b.type = type;
				b.msg = escape(msg);
				b.time = time;
				console.log("chat js myUid = "+myuid)
				mui.fire(page.dialog,"recvMsg_s",{msg:b,sid:sid});
			}else{
				console.log("ERROR send msg failed result = "+data["body"]["reason"]);
				resp.body = "failed";
				resp.reason = data["body"]["reason"];
				mui.fire(plus.webview.getWebviewById("chat_chat.html"),"sendMsgResp",resp);
			}
		})
	})
	
	window.addEventListener("newDialogCreate",function(e){
		var FriendList = e.detail.sFriends;
		var friendsUid = [];
		var friendsName = [];
		for(var i in FriendList){
			friendsUid.push(FriendList[i]["uid"]);
			friendsName.push(FriendList[i]["name"])
		}
		
		var resp = {};
		if(!makeNetworkStateResp(resp)){
			mui.fire(plus.webview.getWebviewById("chat_newdialog.html"),"newDialogCreateResp",resp);
			mui.fire(plus.webview.getWebviewById("chat_sdadduser.html"),"newDialogCreateResp",resp);
			return ;
		}
		
		socket.emit("groupCreate",{title:escape("群聊"), members:friendsUid}, function(data){
            console.log("groupCreate_"+JSON.stringify(data));
            if(data["result"] == "success"){
            	var info = data["body"];
            	var sid = info.sid;
            	var time = info.date;
            	
            	chatDb.insertGl(sid,JSON.stringify(info),function(){
            		var msg = "您将 "+friendsName.toString()+" 加入了群聊";
            		var smsg = {msg:msg,msgType:"system",time:time,type:"mutiple",name:"系统"};
            		mui.fire(plus.webview.getWebviewById("chat_dialog.html"),"recvMsg_s",{sid:sid,msg:smsg});
            		mui.fire(plus.webview.getWebviewById("chat_group.html"),"recoverGroupList");
//          		console.log("groupCreate insert groupList success");
            		resp.result = "success";
            		resp.sid = sid;
            		setTimeout(function(){
            			mui.fire(plus.webview.getWebviewById("chat_sdadduser.html"),"newDialogCreateResp",resp);
            			mui.fire(plus.webview.getWebviewById("chat_newdialog.html"),"newDialogCreateResp",resp);
            		},300)
            	},function(){
            		console.log("ERROR groupCreate insert groupList failed");
            		resp.result = "failed";
            		mui.fire(plus.webview.getWebviewById("chat_sdadduser.html"),"newDialogCreateResp",resp);
            		mui.fire(plus.webview.getWebviewById("chat_newdialog.html"),"newDialogCreateResp",resp);
            	})
            }else{
            	resp.result = "failed";
            	mui.fire(plus.webview.getWebviewById("chat_sdadduser.html"),"newDialogCreateResp",resp);
            	mui.fire(plus.webview.getWebviewById("chat_newdialog.html"),"newDialogCreateResp",resp);
            }
       	})
	})
	window.addEventListener("groupAddUser",function(e){
		var members = e.detail.members;
		var sid = e.detail.sid;
		var resp = {};
		if(!makeNetworkStateResp(resp)){
			mui.fire(plus.webview.getWebviewById("chat_groupadduser.html"),"groupAddUserResp",resp);
			return ;
		}
		
        socket.emit("groupAddUser",{sid:sid, members:members}, function(data){
            console.log("groupAddUser_"+JSON.stringify(data));
            if(data["result"] != "success"){
            	resp.result = "failed";
               	mui.fire(plus.webview.getWebviewById("chat_groupadduser.html"),"groupAddUserResp",resp);
               	return;
            }
			var date = data["body"]["date"];
            chatDb.query('select * from groupList where sid = "'+sid+'"', function(res){
	     		if(res.rows.length == 0){
					return;
				}
				var info = res.rows.item(0).info;
				info = JSON.parse(info);
				var memberName = [];
				for(var j in members){
                    info["members"].push(members[j]);
                    memberName.push(members[j]["nickname"]);
                }
				chatDb.updateGl(sid,JSON.stringify(info),function(){
					var smsg = {msg:"您将 "+ memberName.toString() + " 加入了该群",name:"系统",msgType:"system",time:date,type:"mutiple"};
					mui.fire(page.dialog,"recvMsg_s",{sid:sid,msg:smsg});
					mui.fire(page.dialog,"updateGroupHeadImg",{sid:sid});
					mui.fire(plus.webview.getWebviewById("chat_group.html"),"recoverGroupList");
					
					resp.result = "success";
					setTimeout(function(){
						mui.fire(plus.webview.getWebviewById("chat_groupadduser.html"),"groupAddUserResp",resp);
					},200)
					console.log("groupAddUser update success");
				},function(){
					console.log("ERROR groupAddUser update faield");
				})
	     	})

        })
	})

	window.addEventListener("groupDelUser",function(e){
		var members = e.detail.members;
		var sid = e.detail.sid;
		var resp = {};
		if(!makeNetworkStateResp(resp)){
			mui.fire(plus.webview.getWebviewById("chat_groupdeluser.html"),"groupDelUserResp",resp);
			return ;
		}
		
        socket.emit("groupDelUser",{sid:sid, members:members}, function(data){
            console.log("groupDelUser_"+JSON.stringify(data));
            if(data["result"] != "success"){
            	resp.result = "failed";
               	mui.fire(plus.webview.getWebviewById("chat_groupdeluser.html"),"groupDelUserResp",resp);
               	return;
            }
			var date = data["body"]["date"];
            chatDb.query('select * from groupList where sid = "'+sid+'"', function(res){
	     		if(res.rows.length == 0){
					return;
				}
				var info = res.rows.item(0).info;
				info = JSON.parse(info);
				var memberName = [];
	
				for(var i in members){
					for(var j in info["members"]){
						if(info["members"][j]["uid"]==members[i]["uid"]){
							info["members"].splice(j,1);
						}
					}
					memberName.push(members[i]["nickname"]);
				}
				chatDb.updateGl(sid,JSON.stringify(info),function(){
					var smsg = {msg:"您将 "+ memberName.toString() + " 移出了该群",name:"系统",msgType:"system",time:date,type:"mutiple"};
					mui.fire(page.dialog,"recvMsg_s",{sid:sid,msg:smsg});
					mui.fire(page.dialog,"updateGroupHeadImg",{sid:sid});
					mui.fire(plus.webview.getWebviewById("chat_group.html"),"recoverGroupList");
					
					resp.result = "success";
					mui.fire(plus.webview.getWebviewById("chat_groupdeluser.html"),"groupDelUserResp",resp);
					console.log("groupDelUser update success");
				},function(){
					console.log("ERROR groupDelUser update faield");
				})
	     	})

        })
	})

	window.addEventListener("acceptFriend",function(event){
		var name = event.detail.name;
		var uid = event.detail.uid;
		var newFriendPage = plus.webview.getWebviewById("chat_newfriend.html");
		var resp = {};
		resp.uid = uid;
		if(!makeNetworkStateResp(resp)){
			mui.fire(newFriendPage,"acceptFriendResp",resp);
			return ;
		}
		
		socket.emit("friendAccept",{fname:escape(name), uid:escape(uid)},function(data){
			console.log("socket_friendAccept_"+JSON.stringify(data));
			if(data["result"] == "success"){
				var uid = data["body"]["uid"];
				var sid = data["body"]["sid"];
				var time = data["body"]["time"];
				var name = data["body"]["name"];
				
				var msg = {uid:uid,name:name,time:time,type:"couple",msg:"我们已经成为好友了，开始聊天吧！"};
				var info = {state:"ready",sid:sid,uid:uid,name:name,photoid:"xxxxxx"};
				/*更新或插入数据库*/
				chatDb.query("select * from friendList WHERE uid='"+uid+"'", function(res){
    				if(res.rows.length != 0){
    					/*提取之前的PID*/
    					var old = res.rows.item(0).info;
    					old = JSON.parse(old);
    					info.photoid = old.photoid;
    					info = JSON.stringify(info);
    					chatDb.updateFl(uid,info,function(){
    						mui.fire(newFriendPage,"acceptFriendResp",{uid:uid,result:"success"});
    						mui.fire(plus.webview.getWebviewById("chat_dialog.html"),"recvMsg_s",{sid:sid,msg:msg,beep:true})
    						mui.fire(page.contact,"recoverFriendList");
    						getHeadImgForOneUser(uid,name,"xxx");
    						console.log("friendAccept 更新好友成功");
    					},function(){
    						console.log("friendAccept 更新好友失败");
    					})
    				}else{
    					chatDb.insertFl(uid,info,function(){
    						mui.fire(newFriendPage,"acceptFriendResp",{uid:uid,result:"success"});
    						mui.fire(plus.webview.getWebviewById("chat_dialog.html"),"recvMsg_s",{sid:sid,msg:msg,beep:true})
    						mui.fire(page.contact,"recoverFriendList");
    						getHeadImgForOneUser(uid,name,"xxx");
    						console.log("friendAccept 插入好友成功");
    					},function(){
    						console.log("friendAccept 插入好友失败");
    					})
    				}
    			})
			}else{
				mui.fire(newFriendPage,"acceptFriendResp",{uid:uid,result:"failed"});
			}
		})
	})
	window.addEventListener("deleteFriend",function(e){
		var name = e.detail.name;
		var uid = e.detail.uid;
		var sid = e.detail.sid;
		
		var resp = {};
		if(!makeNetworkStateResp(resp)){
			mui.fire(plus.webview.getWebviewById("chat_friendinfo.html"),"deleteFriendResp",resp);
			return ;
		}
		
		socket.emit("friendDel", {fname:escape(name),uid:escape(uid),sid:sid}, function(data){
            console.log("friendDel_"+JSON.stringify(data));
            if(data["result"] ==  "success"){
            	chatDb.deleteFl(uid,function(){
            		mui.fire(plus.webview.getWebviewById("chat_friendinfo.html"),"deleteFriendResp",{body:"success"});
            		mui.fire(page.contact,"recoverFriendList");
            		mui.fire(page.dialog,"deleteFriend",{uid:uid,sid:sid});
            		console.log("friendDelete 删除好友成功");
            	},function(){
            		console.log("friendDelete 删除好友失败");
            	})
            }else{
            	mui.fire(plus.webview.getWebviewById("chat_friendinfo.html"),"deleteFriendResp",{body:"failed"});
            }
        })
	})
	window.addEventListener("deleteGroup",function(e){
		var sid = e.detail.sid;
		var resp = {};
		if(!makeNetworkStateResp(resp)){
			mui.fire(plus.webview.getWebviewById("chat_chatgroupinfo.html"),"deleteGroupResp",resp);
			return ;
		}
		socket.emit("groupLeave",{sid:sid},function(data){
           	console.log("groupLeave_"+JSON.stringify(data));
           	if(data["result"] == "success"){
	           	resp.result = "success";
           		mui.fire(plus.webview.getWebviewById("chat_chatgroupinfo.html"),"deleteGroupResp",resp);
           	}else{
           		resp.result = "failed";
           		mui.fire(plus.webview.getWebviewById("chat_chatgroupinfo.html"),"deleteGroupResp",resp);
           	}
        })
	})
	window.addEventListener("changeTitle",function(e){
		var sid = e.detail.sid;
		var title = e.detail.title;
		var resp = {};
		if(!makeNetworkStateResp(resp)){
			mui.fire(plus.webview.getWebviewById("chat_chatgroupinfo.html"),"changeTitleResp",resp);
			return ;
		}
		socket.emit("changeGroupTitle", {sid:sid,title:escape(title)}, function(data){
            console.log("changeGroupTitle_"+JSON.stringify(data));
            if(data["result"]=="success"){
            	var time = data["body"]["date"];
            	
            	chatDb.query('select * from groupList where sid = "'+sid+'"', function(res){
					if(res.rows.length == 0){
						resp.result = "failed";
           				mui.fire(plus.webview.getWebviewById("chat_chatgroupinfo.html"),"changeTitleResp",resp);
						return;
					}
					var info = res.rows.item(0).info;
					info = JSON.parse(info);
					info.title = title;
					chatDb.updateGl(sid,JSON.stringify(info),function(){
						mui.fire(page.dialog,"updateGroupTitle",{title:title,sid:sid});
						mui.fire(plus.webview.getWebviewById("chat_chat.html"),"updateGroupTitle",{title:title,sid:sid});
						mui.fire(plus.webview.getWebviewById("chat_group.html"),"recoverGroupList");
						
						var smsg = {msg:"群主将群名称修改为："+title,name:"系统",msgType:"system",time:time,type:"mutiple"};
						mui.fire(page.dialog,"recvMsg_s",{sid:sid,msg:smsg,beep:true});
						
						resp.result = "success";
           				mui.fire(plus.webview.getWebviewById("chat_chatgroupinfo.html"),"changeTitleResp",resp);
						console.log("changeGroupTitle update success");
					},function(){
						resp.result = "failed";
           				mui.fire(plus.webview.getWebviewById("chat_chatgroupinfo.html"),"changeTitleResp",resp);
						console.log("ERROR changeGroupTitle update faield");
					})
				})
            }else{
            	resp.result = "failed";
           		mui.fire(plus.webview.getWebviewById("chat_chatgroupinfo.html"),"changeTitleResp",resp);
            }
        })
	})
	window.addEventListener("setSelfHeadImg",function(e){
		var resp = {};
		if(!makeNetworkStateResp(resp)){
			mui.fire(plus.webview.getWebviewById("chat_me.html"),"setSelfHeadImgResp",resp);
			return ;
		}
		plus.io.resolveLocalFileSystemURL("_doc/"+myuid+"_temp.jpg", function(entry) {
			console.log("读取成功");
			var bitmap = new plus.nativeObj.Bitmap("bbb");
			bitmap.load(entry.toLocalURL(),function(){
				var src = bitmap.toBase64Data();
				src=src.split(',')[1];
				if(!src)
					return;
				src=window.atob(src);
				
				var g_ia = new Uint8Array(src.length);
				for (var i = 0; i < src.length; i++) {
					g_ia[i] = src.charCodeAt(i);
				};
				console.log("正在发送");
				console.log(socket.connected)
				socket.emit('userPhotoSet', {image: JSON.stringify(g_ia)}, function (data) {
					if(data["result"] == "success"){
						console.log("发送成功");
						var pid = data["body"]["photoid"];
						chatDb.query("select * from headImg WHERE uid='"+myuid+"'", function(res){
							if(res.rows.length != 0){
								chatDb.updateHi(myuid,pid,function(){
									/*通知各个页面更新头像*/
//									notifyUpdateHeadImg(myuid);
									mui.fire(plus.webview.getWebviewById("chat_me.html"),"setSelfHeadImgResp",{result:"success"});
								},function(){
									mui.fire(plus.webview.getWebviewById("chat_me.html"),"setSelfHeadImgResp",{result:"failed"});
									console.log("更新好友头像失败");
								})
							}else{
								chatDb.insertHi(myuid,pid,function(){
									/*通知各个页面更新头像*/
//									notifyUpdateHeadImg(myuid);
									mui.fire(plus.webview.getWebviewById("chat_me.html"),"setSelfHeadImgResp",{result:"success"});
								},function(){
									mui.fire(plus.webview.getWebviewById("chat_me.html"),"setSelfHeadImgResp",{result:"failed"});
									console.log("插入好友头像失败 ");
								})
							}
						})
					}else{
						console.log("发送失败");
						mui.fire(plus.webview.getWebviewById("chat_me.html"),"setSelfHeadImgResp",{result:"failed"});
					}
				})
				console.log("加载Base64图片数据成功");
			}, function(){
				mui.fire(plus.webview.getWebviewById("chat_me.html"),"setSelfHeadImgResp",{result:"failed"});
				console.log('加载Base64图片数据失败：'+JSON.stringify(e));
			});
		}, function(e) {
			mui.fire(plus.webview.getWebviewById("chat_me.html"),"setSelfHeadImgResp",{result:"failed"});
			console.log("读取头像错误：" + e.message);
		})
	})
	
	window.addEventListener("setDialogBadge",function(e){
		var count = e.detail.count;
		setBadge($("#chatDialogBadge"),count);
		setIndexChatBadge();
	})
	
	window.addEventListener("setContactBadge",function(e){
		var count = e.detail.count;
		setBadge($("#chatContactBadge"),count);
		setIndexChatBadge();
	})
	
	window.addEventListener("dialogRecoverOver",function(e){
		setIndexChatBadge();
	})
	
	$(document).on("tap","#addLink",function(){
		var children = self.children();
//			var dialog = plus.getWebviewById("");
		for(var i in children){
			mui.fire(children[i],"tapAddLink");
		}
	})
	
	/*设置index.html的CHAT入口的小红点*/
	function setIndexChatBadge(){
		var a = $("#chatDialogBadge").text();
		var b = $("#chatContactBadge").text();
		var count = parseInt(a) + parseInt(b)
		mui.fire(plus.webview.getLaunchWebview(),"setChatBadge",{count:count});
	}
	
/***********************以上为页面逻辑处理,以下为功能逻辑处理**************************/
	function makeNetworkStateResp(resp){
		var isSend = true;
		if(authState == false){
			resp.result = "unauth";
			isSend = false;
		}
		if(socket.connected == false){
			resp.result = "disconnect";
			isSend = false;
		}
		if(isRcvIng == true){
			resp.result = "unauth";/*暂时用这个*/
			isSend = false;
		}
		return isSend;
	}
  
//	setInterval(function(){
//		console.log(socket.connected);
//	},5000)
    function getSelfInfo(g_f, g_g, g_m, g_h){
  		socket.emit("getselfinfo",{}, function(data){
        	console.log("getselfinfo_"+JSON.stringify(data));
        	myuid = data.uid;
        	myName = data.name;
	      	mypid = data.photoid;
	      	nfStamp = data.fstamp;
	      	ngStamp = data.gstamp;
	      	
	      	/*为Login 页面头像加的*/
	      	localStorage.setItem('uid', myuid);

        	chatDb.query('select * from selfInfo where key = "base"', function(res){
        		var info = {uid:myuid,name:myName,fStamp:nfStamp,gStamp:ngStamp};
        		info = JSON.stringify(info);
        		
        		if(res.rows.length == 0){
        			chatDb.insertMe("base",info,function(){
        				console.log("insert self info success");
        			},function(){
        				console.log("ERROR insert self info failed");
        			});
        		}else{//按理说用户的信息(name uid)是不会变的，所以这个分支没有存在的必要
        			chatDb.updateMe("base",info,function(){
        				console.log("update self info success");
        			},function(){
        				console.log("ERROR update self info failed");
        			});
        		}
        	})
   			
        	mui.fire(page.me, "setNameAndUid", {name:myName,uid:myuid});
        	mui.fire(page.dialog, "setNameAndUid", {name:myName,uid:myuid});
        	mui.fire(page.contact, "setNameAndUid", {name:myName,uid:myuid});
        	mui.fire(plus.webview.getWebviewById("chat_group.html"), "setNameAndUid", {name:myName,uid:myuid});
        	
        	console.log("正在获取好友列表信息");
        	g_f(g_g, g_m, g_h);
  		})
    }

    function getFriendList(g_g, g_m, g_h){
    	if(nfStamp != ofStamp){
    		socket.emit("friendsync", {},function(data){
	    	 	console.log("friendsync_"+JSON.stringify(data));
	   
	    	 	if(data["result"] == "success"){
	    	 		/*好友列表和群列表以收到的数据为准，所以这里干脆直接将表清除*/
	    	 		chatDb.cleanFlTable();
	  				var count = 0;
	    	 		for(var i in data["body"]){
	    	 			var uid = data["body"][i]["uid"];
	    	 			var info = data["body"][i];
	    				info = JSON.stringify(info);
	    	
						chatDb.insertFl(uid,info,function(){
							count++;
							/*等写入数据库全部成功后通知contact页面更新好友列表*/
							if(count == data["body"].length){
								mui.fire(page.contact,"recoverFriendList");
								
								console.log("正在获取组列表信息");
								/*收取组列表*/
								g_g(g_m,g_h)
							}
						},function(){
							console.log("ERROR insert friendList:"+info);
						});
	    	 		}
					if(data["body"].length == 0){
						console.log("正在获取组列表信息");
						/*收取组列表*/
						g_g(g_m,g_h)
					}
	    	 	}else{
	    	 		console.log("ERROR get friendList failed");
	    	 	}
	    	})
    	}else{
			/*收取组列表*/
			console.log("跳过好友列表 正在获取组列表信息");
			g_g(g_m,g_h)
    	}
    }
    function getGroupList(g_m,g_h){
//  	if(ngStamp == ogStamp){
		if(1){
    		socket.emit("groupsync",{}, function(data){
		    	var count = 0;
		    	console.log("groupsync_"+JSON.stringify(data));
		    	if(data["result"]=="success"){
		    		chatDb.cleanGlTable();
		    		for(var i in data["body"]){
		    			var sid = data["body"][i]["sid"];
		    			var info = data["body"][i];
		    			info = JSON.stringify(info);
		    			chatDb.insertGl(sid, info,function(){
		    				count++;
							if(count == data["body"].length){
								mui.fire(plus.webview.getWebviewById("chat_group.html"),"recoverGroupList");
								mui.fire(page.dialog,"mergeGroupHeadImg");
								console.log("正在同步消息");
								g_m(g_h);
		    				}
						},function(){
		    				console.log("ERROR insert groupList");
		    			})
		    		}
		    		if(data["body"].length == 0){
	    				console.log("正在同步消息");
						g_m(g_h);
		    		}
		    	}
		    })
    	}else{
    		console.log("跳过组列表同步 正在同步消息");
			g_m(g_h);
    	}
    }

    function getMsg(g_h){
    	socket.emit("msgSync",{}, function (data){
    		if(data["result"]=="success"){
    			cState.clean();
				console.log("msgSync_获取成功");
				isRcvIng = false;
				/*发送到dialog页面处理*/
				mui.fire(page.dialog,"recvMsg",{msg:data["body"]});
				
				g_h();
    		}else{
    			console.log("ERROR msgSync_获取失败")
    		}
    	})
    }
    function getHeadImg(){
    	var allUser={};
    	
    	/*先将自己添加进去*/
    	allUser[myuid] = {name:myName,pid:mypid};
    	
    	/*提取所有的好友，包括群组中的*/
    	chatDb.query('select * from friendList', function(res){
    		for (i = 0; i < res.rows.length; i++) {
				var info=res.rows.item(i).info;
				info = JSON.parse(info);
				uid = info.uid;
				pid = info.uid;
				name = info.name;
				pid = info.photoid;
				if(info.state == "ready" || info.state == "wait_me"){
					allUser[uid] = {name:name,pid:pid};
				}
			}
    		chatDb.query('select * from groupList', function(res){
    			for (i = 0; i < res.rows.length; i++) {
    				var info=res.rows.item(i).info;
					info = JSON.parse(info);
					members = info.members;
					for(var j in members){
						var uid = members[j].uid;
						if(!allUser[uid]){
							var nickname = members[j].nickname;
							var pid = members[j].photoid;
							allUser[uid] = {name:nickname,pid:pid};
						}
					}
    			}
    			getHeadImgFromList(allUser);
    		})
    	})
    }
    function getHeadImgFromServer(uid,cback){
    	socket.emit("userPhotoGet",{uid:uid},function(data){
            if(data["result"]=="success" && data["body"]["photoid"] && data["body"]["image"]){
//          	console.log("get pid = "+data["body"]["photoid"]);
            	/*获取到好友头像*/
                convertHeadImg(data["body"]["image"],function(img){
                    var pid=data["body"]["photoid"];
					cback(pid,img);
                })
            }else if(data["result"]=="failed") {
                alert("获取好友头像失败,UID="+uid + " 原因:"+JSON.stringify(data))
            }
        })
    }
    
    function notifyUpdateHeadImg(uid){
    	/*通知me,concat和group页面更新头像*/
		if(uid == myuid){
			mui.fire(page.me,"updateHeadImg");
			mui.fire(plus.webview.getWebviewById("index-menu"),"updateHeadImg",{uid:uid});
		}
		mui.fire(page.contact,"updateHeadImg",{uid:uid});
		mui.fire(plus.webview.getWebviewById("chat_group.html"),"updateHeadImg",{uid:uid});
		mui.fire(page.dialog,"updateHeadImg",{uid:uid});
    }
    function getHeadImgFromList(list){
    	for(var i in list){
    		var uid = i;
    		
    		var pid = list[i]["pid"];
    		var name = list[i]["name"];
    		getHeadImgForOneUser(uid,name,pid);
    	}
    }
    function getHeadImgForOneUser(uid,name,pid){
		chatDb.query("select * from headImg WHERE uid='"+uid+"'", function(res){
			var oldPid;
			if(res.rows.length != 0){
				oldPid = res.rows.item(0).info;
			}

			/*存在且PID不同,更新*/
			if((res.rows.length != 0) && (oldPid != pid)){
				getHeadImgFromServer(uid,function(photoid,img){
					saveHeadImgFile(uid,img,90,function(){
						chatDb.updateHi(uid,photoid,function(){
						console.log("更新好友头像成功 uid = "+ uid+" name = "+name+ " oldpid="+pid+" newpid="+photoid);
						/*通知各个页面更新头像*/
						notifyUpdateHeadImg(uid);
						},function(){
							console.log("更新好友头像失败 uid = "+ uid+" name = "+name);
						})
					});
				})
			}else if((res.rows.length == 0) && (pid && pid != "")){//不存在且有PID，插入
				getHeadImgFromServer(uid,function(photoid,img){
					saveHeadImgFile(uid,img,90,function(){
						chatDb.insertHi(uid,photoid,function(){
						console.log("插入好友头像成功 uid = "+ uid+" name = "+name+ " oldpid="+pid+" newpid="+photoid);
						/*通知各个页面更新头像*/
						notifyUpdateHeadImg(uid);
						},function(){
							console.log("插入好友头像失败 uid = "+ uid+" name = "+name);
						})
					});
				})
			}
		})
    }
  
	function chatConenctServer(){
		console.log("正在连接");
	  	socket = io.connect("https://lvzhouchat.h3c.com",{secure:true});
	}
	function chatAuth(session_id){
        var para = {
            chatid: session_id,
//			user:myName,
            query: false
        };
        console.log("session_id = "+ session_id);
        socket.emit('authentication', para,function(info){
        	console.log("authentication_"+info);
        });
    }

	function chatSocketListen(){
		socket.on("connect",function(){
			cState.setStateAuth();
			console.log("正在认证");
			chatAuth(session_id);
			isRcvIng = true;
		})
		socket.on('authenticated', function(info){
            console.log("认证结果：" + info);
            if(info){
            	authState = true;
            	cState.setStateRecv();
            	console.log("正在收取");
            	getSelfInfo(getFriendList,getGroupList,getMsg,getHeadImg);
            }else{
            	cState.setStateAuthFailed();
            }
		})
		socket.on("connecting",function(){
			cState.setStateConnecting();
            console.log("正在连接");
        })
        socket.on("connect_failed",function(){
        	cState.setStateConnectFailed();
            console.log("连接失败！");
        })
        socket.on("reconnecting", function(){
        	cState.setStateReConnecting();
            console.log("正在重连...");
        })
        socket.on("reconnect", function(){
            console.log("重连成功！");
        })
        socket.on("reconnect_failed", function(){
            console.log("重连失败!");
        })
        socket.on("disconnect", function(){
        	authState = false;
//    		cState.setStateConnectDown();
        	
//          console.log("连接断开!");
        })
        
        /******************以上为系统事件,以下为用户事件******************/
        socket.on("message", function(data){
            console.log("message_"+JSON.stringify(data));
            chatProcRecvMsgPush(data);
        })
        socket.on("friendAccept", function(data){
            console.log("friendAccept_"+JSON.stringify(data));
            chatProcAcceptPush(data);
        })
        socket.on("friendDel", function (data){
            console.log("friendDel_"+JSON.stringify(data));
            procRcvFriendDelPush(data);
        })
        socket.on("groupCreate", function(data){
            console.log("groupCreate_"+JSON.stringify(data));
            chatProcGroupCreatePush(data);
        })
		socket.on("groupAddUser",function(data){
			console.log("groupAddUser_"+JSON.stringify(data));
			procRcvGroupAddUserPush(data);
		})
        socket.on("groupDelUser",function(data){
            console.log("groupDelUser_push"+JSON.stringify(data));
            procRcvGroupDelUserPush(data);
        })
        socket.on("friendAdd", function(data){
            console.log("friendAdd_"+ JSON.stringify(data));
            procRcvAddFriendPush(data);
        })
        socket.on("changeGroupTitle", function(data){
            console.log("changeGroupTitle_"+JSON.stringify(data));
            procRcvChangeGroupTitlePush(data);
        })
      	socket.on("groupLeave", function(data){
            console.log("groupLeave_"+JSON.stringify(data));
            procRcvLeaveGroupPush(data);
        })
        socket.on("photoChg",function(data){
            console.log("photoChg_"+JSON.stringify(data));
            procRcvHeadImgChgPush(data);
        })
        
	}
	function chatProcRecvMsgPush(data){
		if(data["result"]=="success"){
			/*发送到dialog页面处理*/
			mui.fire(page.dialog,"recvMsg",{msg:data["body"]});
		}else{
			console.log("msg_获取失败")
		}
	}
	function chatProcAcceptPush(data){
	    if(data["result"] != "success"){
            return;
        }
        var sid = data["body"]["sid"];
        var uid = data["body"]["uid"];//主动人的UID  注：支持多个相同用户同时在线才搞的这一套
        data["body"]["user"] = unescape(data["body"]["user"]);
        var user = data["body"]["user"];//主动人的名字
        var fname = data["body"]["fname"];//被动人的名字
        var fuid = data["body"]["fuid"];//被动人的UID
        var time = data["body"]["time"];
        var state = data["body"]["state"];
        
        var targetUid;
        var targetName;
        if(uid == myuid){
        	targetUid = fuid;
        	targetName = fname;
        }else{
        	targetUid = uid;
        	targetName = user;
        }

    	chatDb.deleteFl(uid,function(){
    		var info = {uid:targetUid,sid:sid,name:targetName,state:state,photoid:""};
    		info = JSON.stringify(info);
    		chatDb.insertFl(uid,info,function(){
    			var msg = {uid:targetUid,name:targetName,time:time,type:"couple",msg:"我们已经成为好友了，开始聊天吧！"};
    			mui.fire(plus.webview.getWebviewById("chat_dialog.html"),"recvMsg_s",{sid:sid,msg:msg,beep:true});
    			
    			/*获取好友头像*/
    			getHeadImgForOneUser(targetUid,targetName,"xxxx");

    			/*通知CONCAT页面 更新*/
    			mui.fire(page.contact,"recoverFriendList");
    			
    			console.log("accept 插入好友成功")
    		},function(){
    			console.log("accept 插入好友失败")
    		})
    		console.log("accept 删除好友成功")
    	},function(){
    		console.log("accept 删除好友失败")
    	})
	}
	function procRcvFriendDelPush(data){
	    if(data["result"] != "success"){
            return;
        }
        var uid = data["body"]["uid"];
        var user = data["body"]["user"];
        var fname = data["body"]["fname"];
        var fuid = data["body"]["fuid"];
        var date = data["body"]["time"];
        var state = data["body"]["state"];
    
        /*主动*/
        if(uid == myuid){
        	/*找到他的SID*/
        	chatDb.query('select * from friendList where uid = "'+fuid+'"', function(res){
				if(res.rows.length == 0){
					return;
				}
				var info = res.rows.item(0).info;
				info = JSON.parse(info);
				var sid = info.sid;
				mui.fire(page.dialog,"deleteFriend",{uid:fuid,sid:sid});
				
				/*主动和被动都要做的事情 删除数据库 重置好友列表*/
		        chatDb.deleteFl(fuid,function(){
		    		mui.fire(page.contact,"recoverFriendList");
		    		console.log("friendDelete 删除好友成功");
		    	},function(){
		    		console.log("friendDelete 删除好友失败");
		    	})
			})
        }else{
        	/*主动和被动都要做的事情 删除数据库 重置好友列表*/
	        chatDb.deleteFl(uid,function(){
	    		mui.fire(page.contact,"recoverFriendList");
	    		console.log("friendDelete 删除好友成功");
	    	},function(){
	    		console.log("friendDelete 删除好友失败");
	    	})
        }
	}
	
	function chatProcGroupCreatePush(data){
		if(data["result"] != "success"){
            return;
        }
		var sid=data["body"]["sid"];
        data["body"]["title"] = unescape(data["body"]["title"]);
        var title=data["body"]["title"];
        var date = data["body"]["date"];
        var owner = data["body"]["owner"];
        var member = data["body"]["members"];
        var sureMember = [];
        var msg;
        if(owner == myuid){
			for(var i in data["body"]["members"]){
				if( data["body"]["members"][i]["uid"] != myuid){
					sureMember.push(unescape(data["body"]["members"][i]["nickname"]));
				}
			}
	        msg = "您将 "+sureMember.toString()+" 加入了群聊。";
        }else{
        	var ownerNickName;
            for(var i=0 in  data["body"]["members"]){
                /*找到OWNER*/
                if(data["body"]["members"][i]["uid"]==owner){
                    ownerNickName = data["body"]["members"][i]["nickname"];
                }
                /*将自己从MEMBERS中摘除*/
                if(data["body"]["members"][i]["uid"] != myuid && data["body"]["members"][i]["uid"] != owner){
                    var nickname = data["body"]["members"][i]["nickname"];
                    sureMember.push(nickname);
                }
            }
            msg = ownerNickName +" 将您加入群会话，其他成员还有 "+sureMember.toString();
        }
        var info = JSON.stringify(data["body"]);
        chatDb.insertGl(sid,info,function(){
        	console.log("groupCreate 插入组列表成功");
        	var smsg = {msg:msg,msgType:"system",time:date,type:"mutiple",name:"系统"};
        	mui.fire(plus.webview.getWebviewById("chat_dialog.html"),"recvMsg_s",{sid:sid,msg:smsg,beep:true})
        	mui.fire(plus.webview.getWebviewById("chat_group.html"),"recoverGroupList");
        },function(){
        	console.log("groupCreate 插入组列表失败");
        })
	}
	function procRcvGroupAddUserPush(data){
        if(data["result"]!="success"){
            return;
        }
        var sid = data["body"]["sid"];
        var actor = data["body"]["actor"];
        var date = data["body"]["date"];
        var members = data["body"]["members"];
        var groupinfo = data["body"]["groupinfo"];
		var msg;
		var actorName;
		
		/*拼装MEMBER名字*/
		var memberName = [];
		for(var i in members){
			memberName.push(members[i]["nickname"]);
		}
		/*找到ACTOR的名字*/
		for(var i in groupinfo["members"]){
			if(actor == groupinfo["members"][i]["uid"]){
				actorName = groupinfo["members"][i]["nickname"];
				break;
			}
		}
		/*拼装系统消息*/
		msg = actorName +" 将 "+memberName.toString() +" 加入了该群";
		if(actor == myuid){
        	msg = "您将  "+memberName.toString()+" 加入了该群";
        }
        for(var i in members){
            if(myuid == members[i]["uid"]){
                msg = actorName +" 将您加入了该群 ";
                break;
            }
        }
        chatDb.deleteGl(sid,function(){
        	console.log("groupAddUser 删除组列表成功");
        	chatDb.insertGl(sid,JSON.stringify(groupinfo),function(){
        		var smsg = {msg:msg,name:"系统",msgType:"system",time:date,type:"mutiple"};
        		mui.fire(plus.webview.getWebviewById("chat_dialog.html"),"recvMsg_s",{sid:sid,msg:smsg,beep:true});
        		mui.fire(plus.webview.getWebviewById("chat_group.html"),"recoverGroupList");
        		//头像以及组头像
        		mui.fire(page.dialog,"updateGroupHeadImg",{sid:sid});
        		for(var i in members){
        			getHeadImgForOneUser(members[i]["uid"],members[i]["nickname"],"abcd");
        		}
        		
        		console.log("groupAddUser 插入组列表成功");
        	},function(){
        		console.log("groupAddUser 插入组列表失败");
        	})
        },function(){
        	console.log("groupAddUser 删除组列表失败");
        })
	}
	function procRcvGroupDelUserPush(data){
		if(data["result"]!="success"){
            return;
        }
        var sid = data["body"]["sid"];
        var date = data["body"]["date"];
        var actor = data["body"]["actor"]
        var members = data["body"]["members"];
        var identity = 1;
        var msg;
        
        /*拼装MEMBER名字*/
		var memberName = [];
		for(var i in members){
			memberName.push(members[i]["nickname"]);
		}
		msg = "群主将 "+memberName.toString()+" 移出了该群";
        if(actor == myuid){
        	msg = "您将  "+memberName.toString()+" 移出了该群";
        	identity = 2;
        }
        for(var i in members){
	        if(myuid == members[i]["uid"]){
	            msg = "群主将您移出了该群 ";
	            identity = 3;
	            break;
	        }
        }
        
      	chatDb.query('select * from groupList where sid = "'+sid+'"', function(res){
			if(res.rows.length == 0){
				return;
			}
			var info = res.rows.item(0).info;
			info = JSON.parse(info);
			/*如果删除的人中有自己 那么只需将自己从该群的成员中摘除*/
			if(identity == 3){
				for(var i in info["members"]){
					if(info["members"][i]["uid"] == myuid){
						info["members"].splice(i,1);
					}
				}
			}else{
				for(var i in members){
					for(var j in info["members"]){
						if(info["members"][j]["uid"] == members[i]["uid"]){
							info["members"].splice(j,1);
						}
					}
				}
			}
		
			chatDb.updateGl(sid,JSON.stringify(info),function(){
				console.log("groupDelUser 更新组列表成功");
				var smsg = {msg:msg,name:"系统",msgType:"system",time:date,type:"mutiple"};
				mui.fire(plus.webview.getWebviewById("chat_dialog.html"),"recvMsg_s",{sid:sid,msg:smsg,beep:true});
				mui.fire(plus.webview.getWebviewById("chat_group.html"),"recoverGroupList");
        		mui.fire(page.dialog,"updateGroupHeadImg",{sid:sid});
			},function(){
				console.log("groupDelUser 更新组列表失败");
			})
      	})
	}
	
	function procRcvAddFriendPush(data){
		if(data["result"] != "success"){
		    return;
		}
		var alreadyExist = false;
		var sid = data["body"]["sid"];
		var uid = data["body"]["uid"];
		var user = data["body"]["user"];
		var fname = data["body"]["fname"];
		var fuid = data["body"]["fuid"];
		var date = data["body"]["time"];
		var state;
		var targetUid;
		var targetName;
		if(uid == myuid){
			state = "wait_other";
			targetUid = fuid;
			targetName = fname;
		}else{
			state = "wait_me";
			targetUid = uid;
			targetName = user;
		}
		var info = {uid:targetUid,sid:"",name:targetName,state:state,photoid:""};

		chatDb.deleteFl(targetUid,function(){
			chatDb.insertFl(targetUid,JSON.stringify(info),function(){
				mui.fire(page.contact,"recoverFriendList");
				mui.fire(page.dialog,"recvAddFriendPush");
				
				/*获取好友头像*/
    			getHeadImgForOneUser(targetUid,targetName,"xxxx");
  				
				console.log("friendAdd insert friendInfo success");
			},function(){
				console.log("ERROR friendAdd insert friendInfo failed");
			})
			console.log("friendAdd delete friendInfo success");
		},function(){
			console.log("ERROR friendAdd delete friendInfo failed")
		})
	}
	function procRcvChangeGroupTitlePush(data){
        if(data["result"]!="success"){
            return;
        }
        var title = data["body"]["title"];
        var sid = data["body"]["sid"];
        var time = data["body"]["date"];
        chatDb.query('select * from groupList where sid = "'+sid+'"', function(res){
			if(res.rows.length == 0){
				return;
			}
			var info = res.rows.item(0).info;
			info = JSON.parse(info);
			info.title = title;
			chatDb.updateGl(sid,JSON.stringify(info),function(){
				mui.fire(page.dialog,"updateGroupTitle",{title:title,sid:sid});
				mui.fire(plus.webview.getWebviewById("chat_chat.html"),"updateGroupTitle",{title:unescape(title),sid:sid});
				mui.fire(plus.webview.getWebviewById("chat_group.html"),"recoverGroupList");
				
				var smsg = {msg:"群主将群名称修改为："+unescape(title),name:"系统",msgType:"system",time:time,type:"mutiple"};
				mui.fire(page.dialog,"recvMsg_s",{sid:sid,msg:smsg,beep:true});
				console.log("changeGroupTitle update success");
			},function(){
				console.log("ERROR changeGroupTitle update faield");
			})
		})
	}
	function procRcvLeaveGroupPush(data){
		if(data["result"] != "success"){
			return;
		}
	  	var sid = data["body"]["sid"];
        var date = data["body"]["date"];
        var leaverUid = data["body"]["leaveruid"];
        var ownerUid = data["body"]["owner"];
        var leaverName;
        if(leaverUid == myuid){
        	chatDb.deleteGl(sid,function(){
        		mui.fire(page.dialog,"selfLeaveGroup",{sid:sid});
        		mui.fire(plus.webview.getWebviewById("chat_chat.html"),"selfLeaveGroup",{sid:sid});
        		mui.fire(plus.webview.getWebviewById("chat_group.html"),"recoverGroupList");
        		console.log("LeaveGroup Delete success");
        	},function(){
        		console.log("ERROR LeaveGroup Delete faield");
        	})
        	
        }else{
	        chatDb.query('select * from groupList where sid = "'+sid+'"', function(res){
	     		if(res.rows.length == 0){
					return;
				}
				var info = res.rows.item(0).info;
				info = JSON.parse(info);
				info["owner"] = ownerUid;
				for(var i in info["members"]){
					if(info["members"][i]["uid"] == leaverUid){
						leaverName = info["members"][i]["nickname"];
						info["members"].splice(i,1);
					}
				}
				chatDb.updateGl(sid,JSON.stringify(info),function(){
					var smsg = {msg:leaverName+" 离开了该群",name:"系统",msgType:"system",time:date,type:"mutiple"};
					mui.fire(page.dialog,"recvMsg_s",{sid:sid,msg:smsg,beep:true});
					mui.fire(page.dialog,"updateGroupHeadImg",{sid:sid});
					mui.fire(plus.webview.getWebviewById("chat_group.html"),"recoverGroupList");
					console.log("LeaveGroup update success");
				},function(){
					console.log("ERROR LeaveGroup update faield");
				})
	     	})
        }
	}
	function procRcvHeadImgChgPush(data){
		if(data["result"]!="success"){
			return;
		}
		var uid = data["body"]["uid"];
		var name = "balabala";
		var pid = "xxx";
		getHeadImgForOneUser(uid,name,pid);
	}
	
	function initOptionData(){
		/*新消息提示初始化*/
		chatDb.query('select * from selfInfo where key = "noticeOpt"',function(res){
			console.log("初始化数据");
			if(res.rows.length == 0){
				var info ={};
				info.beep=true;
				info.vibrate = true;
				chatDb.insertMe("noticeOpt",JSON.stringify(info),function(){
					console.log("insert noticeOpt success");
				},function(){
					console.log("ERROR insert noticeOpt failed");
				})
			}
		})
	}
    function createTableIfNotExist(){
    	chatDb.createTable('create table if not exists selfInfo (key unique, info)');
    	chatDb.createTable('create table if not exists friendList (uid unique, info)');
    	chatDb.createTable('create table if not exists groupList (sid unique, info)');
    	chatDb.createTable('create table if not exists headImg (uid unique, info)');
    	chatDb.createTable('create table if not exists dialogSum (key unique, info)');
    	initOptionData();
    }
    
    function getSessionId(){
    	var state = window.app.getState();
	    console.log(JSON.stringify(state));
	
	    if(!state || state.session=="null" || state.session==""){
	    	alert("获取SESSION_ID失败")
	    }else{
	    	return state.session;
	    }
    }
    function getUserName(){
    	var state = window.app.getState();
	    console.log(JSON.stringify(state));
	
	    if(!state || state.account=="null" || state.account==""){
	    	alert("获取SESSION_ID失败")
	    }else{
	    	return state.account;
	    }
    }
	function recoverSelfInfo(){
		chatDb.query('select * from selfInfo where key = "base"', function(res){
			if(res.rows.length != 0){
				var info = res.rows.item(0).info;
				info = JSON.parse(info);
				myuid = info.uid;
				myName = info.name;
				ofStamp = info.fStamp;
				ogStamp = info.gStamp;
				mui.fire(plus.webview.getWebviewById("index-menu"),"updateHeadImg",{uid:myuid});
			}
			
	    	/*创建连接*/
	    	session_id = getSessionId();
	    	myName = getUserName();
	    	chatConenctServer();
	    	chatSocketListen();
		})
	}

})(jQuery,mui)
