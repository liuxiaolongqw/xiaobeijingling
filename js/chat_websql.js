var chatDb = {};
var myDb;
(function($,mui){
	
	chatDb.create = function(name, size){
		var db_name = name ? name : 'db_test';
		var db_size = size ? size : 2;
		
		return openDatabase(db_name, '1.0', 'db_test', db_size * 1024 * 1024);
	};
	
	chatDb.createTable = function(sql){
		myDb.transaction(function(tx){tx.executeSql(sql);});	
	}
	chatDb.insertFl = function(uid, info,cback,errorCback){
		myDb.transaction(function(tx){
			tx.executeSql("insert into friendList (uid, info) values (?,?)",[uid,info],cback,errorCback);
		});
	}
	chatDb.updateFl = function(uid,info,cback,ecback){
		myDb.transaction(function(tx){
			tx.executeSql("update friendList set info = ? where uid= ?",[info, uid],cback,ecback);
		})
	}
	chatDb.deleteFl = function(uid,cback,ecback){
		myDb.transaction(function(tx){
			tx.executeSql("delete from friendList where uid= ?",[uid],cback,ecback);
		})
	}
	
	chatDb.insertGl = function(sid,info,cback,errorcBack){
		myDb.transaction(function(tx){
			tx.executeSql("insert into groupList (sid, info) values (?,?)",[sid,info],cback,errorcBack);
		})
	}
	chatDb.deleteGl = function(sid,cback,ecback){
		myDb.transaction(function(tx){
			tx.executeSql("delete from groupList where sid= ?",[sid],cback,ecback);
		})
	}
	chatDb.updateGl = function(sid,info,cback,ecback){
		myDb.transaction(function(tx){
			tx.executeSql("update groupList set info = ? where sid= ?",[info, sid],cback,ecback);
		})
	}
	
	chatDb.insertHi = function(uid,info,cback,ecback){
		myDb.transaction(function(tx){
			tx.executeSql("insert into headImg (uid, info) values (?,?)",[uid,info],cback,ecback);
		})
	}
	chatDb.updateHi = function(uid,info,cback,ecback){
		myDb.transaction(function(tx){
			tx.executeSql("update headImg set info = ? where uid= ?",[info, uid],cback,ecback);
		})
	}
	chatDb.insertMe = function(key,info,cback,ecback){
		myDb.transaction(function(tx){
			tx.executeSql("insert into selfInfo (key, info) values (?,?)",[key,info],cback,ecback);
		})
	}
	chatDb.updateMe = function(key,info,cback,ecback){
		myDb.transaction(function(tx){
			tx.executeSql("update selfInfo set info = ? where key= ?",[info, key],cback,ecback);
		})
	}
	chatDb.insertMs = function(table,mid,info,cback,ecback){
		myDb.transaction(function(tx){
//			tx.executeSql("insert into '"+table+"' (mid, info) values (?,?)",[mid,info],cback,ecback);
			tx.executeSql("insert into '"+table+"' (info) values (?)",[info],cback,ecback);
		})
	}
	chatDb.cleanMsTable = function(table){
		myDb.transaction(function(tx){
			tx.executeSql("DELETE FROM '"+table+"'");
		});
	}
	chatDb.cleanFlTable = function(){
		myDb.transaction(function(tx){
			tx.executeSql("DELETE FROM friendList");
		});
	}
	chatDb.cleanGlTable = function(){
		myDb.transaction(function(tx){
			tx.executeSql("DELETE FROM groupList");
		});
	}
	chatDb.cleanDsTable = function(){
		myDb.transaction(function(tx){
			tx.executeSql("DELETE FROM dialogSum");
		});
	}
	chatDb.cleanMrTable = function(table){
		myDb.transaction(function(tx){
			tx.executeSql("DELETE FROM '"+table+"'");
		});
	}
	
	chatDb.insertDs = function(key,info,cback,ecback){
		myDb.transaction(function(tx){
			tx.executeSql("insert into dialogSum (key, info) values (?,?)",[key,info],cback,ecback);
		})
	}
	
	chatDb.query = function(sql, func){
		myDb.transaction(function(tx){
			tx.executeSql(sql, [], function(tx, results) {
				func(results);
			}, null);
		});
	};

	var state = window.app.getState();
	myDb = chatDb.create(state.account,20);
})(jQuery,mui)

