/**
 * 演示程序当前的 “注册/登录” 等操作，是基于 “本地存储” 完成的
 * 当您要参考这个演示程序进行相关 app 的开发时，
 * 请注意将相关方法调整成 “基于服务端Service” 的实现。
 **/
(function($, owner) {
    var serverUrl = "https://lvzhouv3.h3c.com/v3";
    //var sessionid = null;
    function logoutOnCas(casLogoutUrl, callBack){
        var err = 0;
        var errMsg = null;
        var xhr = new plus.net.XMLHttpRequest();
        xhr.onreadystatechange = function () {
            switch ( xhr.readyState ) {
                case 0:
                    //mui.toast( "xhr请求已初始化" );
                break;
                case 1:
                    //mui.toast( "xhr请求已打开" );
                break;
                case 2:
                    //mui.toast( "xhr请求已发送" );
                break;
                case 3:
                    //mui.toast( "xhr请求已响应");
                    break;
                case 4:
                    if ( xhr.status >= 200 && xhr.status < 300 || xhr.status === 304 ) {
                        var errorCode = 0;
                        callBack(errorCode);
                    } else {
                        loginError = 99;
                        callBack(loginError);
                    }
                    break;
                default :
                    break;
            }
        }
        xhr.open( "GET", casLogoutUrl);
        xhr.setRequestHeader('Content-Type','application/json');
        xhr.send();
    }

    owner.logout = function (callBack){
        var err = 0;
        var errMsg = null;
        var xhr = new plus.net.XMLHttpRequest();
        xhr.onreadystatechange = function () {
            switch ( xhr.readyState ) {
                case 0:
                    //mui.toast( "xhr请求已初始化" );
                break;
                case 1:
                    //mui.toast( "xhr请求已打开" );
                break;
                case 2:
                    //mui.toast( "xhr请求已发送" );
                break;
                case 3:
                    //mui.toast( "xhr请求已响应");
                    break;
                case 4:
                    if ( xhr.status == 200 ) {
                        var data=JSON.parse(xhr.responseText);

                        var casLogoutUrl = data.cas_url_logout;
                        logoutOnCas(casLogoutUrl, callBack);
                    } else {
                        loginError = 99;
                        callBack(loginError);
                    }
                    break;
                default :
                    break;
            }
        }
        xhr.open( "GET", serverUrl + '/app/logout');
        xhr.setRequestHeader('Content-Type','application/json');
        xhr.send();
    };
	/**
	 * 用户登录
	 **/
	owner.login = function(loginInfo, callback) {
		callback = callback || $.noop;
		loginInfo = loginInfo || {};
		loginInfo.account = loginInfo.account || '';
		loginInfo.password = loginInfo.password || '';
		if (loginInfo.account.length < 6) {
			return callback('账号最短为 6 个字符');
		}
		if (loginInfo.password.length < 8) {
			return callback('密码最短为 8 个字符');
		}
//		var users = JSON.parse(localStorage.getItem('$users') || '[]');
//		var authed = users.some(function(user) {
//			return loginInfo.account == user.account && loginInfo.password == user.password;
//		});
//		if (authed) {
//			return owner.createState(loginInfo.account, callback);
//		} else {
//			return callback('用户名或密码错误');
//		}
		return callback();
	};

    owner.saveUser = function(name, sessionid, callback){
//      var users = JSON.parse(localStorage.getItem('$users') || '[]');
//      users.push(name);
        localStorage.setItem('$users', name);
        return owner.createState(name, sessionid, callback);
    };

    owner.getUser = function(name, sessionid, callback){
        var user = localStorage.getItem('$users') || '';
        return user;
    };

	owner.createState = function(name, sessionid, callback) {
		var state = owner.getState();
		state.account = name;
		state.session = sessionid;
		state.token = "token123456789";
		owner.setState(state);
		return callback();
	};

    owner.getUsername = function(callBack){
         $.ajax({
            url: serverUrl + '/app/getUsername',
            type: 'get',
            contentType:'application/json; charset=utf-8',//指定POST提交的数据类型
            dataType:'json',
            timeout: 20000,
            success: function(data,status){
                if(status == 'success'){
                    var username = data.username;
                    var errCode = 0;
                    callBack(username, errCode);
                }
            },
            error: function(data,err){
                var errCode = 3;
                callBack(data, errCode);
            }
        });
    }

	/**
	 * 新用户注册
	 **/
	owner.reg = function(regInfo, callback) {
		callback = callback || $.noop;
		regInfo = regInfo || {};
		regInfo.account = regInfo.account || '';
		regInfo.password = regInfo.password || '';
		if (regInfo.account.length < 6) {
			return callback('用户名最短需要 6 个字符');
		}
		if (regInfo.password.length < 8) {
			return callback('密码最短需要 8 个字符');
		}
		if ((regInfo.phone.length != 11) || (regInfo.phone.indexOf('1')!= 0)) {
			return callback('不是有效的电话号码');
		}
		if (!checkEmail(regInfo.email)) {
			return callback('邮箱地址不合法');
		}
//		var users = JSON.parse(localStorage.getItem('$users') || '[]');
//		users.push(regInfo);
//		localStorage.setItem('$users', JSON.stringify(users));
		return callback();
	};

	/**
	 * 获取当前状态
	 **/
	owner.getState = function() {
		var stateText = localStorage.getItem('$state') || "{}";
		return JSON.parse(stateText);
	};

	/**
	 * 设置当前状态
	 **/
	owner.setState = function(state) {
		state = state || {};
		localStorage.setItem('$state', JSON.stringify(state));
		//var settings = owner.getSettings();
		//settings.gestures = '';
		//owner.setSettings(settings);
	};

	var checkEmail = function(email) {
		email = email || '';
		return (email.length > 3 && email.indexOf('@') > -1);
	};

	/**
	 * 找回密码
	 **/
	owner.forgetPassword = function(email, callback) {
		callback = callback || $.noop;
		if (!checkEmail(email)) {
			return callback('邮箱地址不合法');
		}
		return callback(null, '新的随机密码已经发送到您的邮箱，请查收邮件。');
	};

	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	owner.getSettings = function() {
		var settingsText = localStorage.getItem('$settings') || "{}";
		return JSON.parse(settingsText);
	}
}(mui, window.app = {}));