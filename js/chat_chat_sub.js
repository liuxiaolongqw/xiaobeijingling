(function($,mui){	
  	mui.init();
  	mui.plusReady(function(){
  	})
  	window.addEventListener("scrollToBootom",function(event){
		scrollToBootom(150);
	})
  	window.addEventListener("sendMsg",function(event){
		var msg = event.detail.msg;
		var msgString = makeHtmlStringMeSend(msg);
		
		$(".mui-content").append(msgString);
		scrollToBootom(300);
	})
  	
	mui.ready(function(){
		scrollToBootom(1);
  	})
	
	function scrollToBootom(time){
		var height = $(".mui-content").height();
		mui.scrollTo(height,time);
	}

	function makeHtmlStringMeSend(msg){
		var div1 = $("<div class='chat_msg' align='right'></div>");
		var div2 = $("<div class='chat_arrow_right'></div>");
		var img = $("<img class='chat_headimg' src='images/chat/test_xiaozhu.jpg'>");
		var div3 = $("<div class='chat_msg_div_right'></div>");
		var pre = $("<pre class='chat_msg_pre chat_msg_pre_right' align='left'></pre>");
		pre.text(msg);
		div3.append(pre);
		div1.append(img,div2,div3);
		
		return div1;
	}
})(jQuery,mui)
