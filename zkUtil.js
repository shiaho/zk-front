/**
 * Created by ksh on 16/1/15.
 */
var ZK = require('zkjs');
var fs = require('fs');
var config = require('config');
var zk = new ZK(config.zk);

zk.start(function (err) {
    console.log('zk started')
});


module.exports.list = function(path, cb) {
    zk.getChildren(path, function (err, children, zstat) {
        cb(children);
    })
};


module.exports.get = function(path, cb) {
	zk.get(
		path,
		function (watch) {
		},
		function (err, value, zstat) {
			cb(value, zstat);
		}
	)
};

module.exports.set = function(path, data, version) {
	zk.set(
		path,
		data,
		version || -1,
		function (err, zstat) {
			if (!err) {
				console.log('the new version number is', zstat.version)
			}
		}
	)
};


module.exports.del = function(path, version, callback) {
	zk.del(
		path,
		version || -1,
		function (err) {
			if (!err) {
				console.log(`delete node(${path}) success`);
			} else {
				var error = zk.errors.toError(err);
				console.error(`delete node(${path}) error: `, error);
			}
		}
	)
};


module.exports.delR = function(path, version, callback) {
	zk.del(
		path,
		version || -1,
		function (err) {
			if (!err) {
				console.info(`remove node(${path}) success`);
				callback && callback();
			} else {
				var error = zk.errors.toError(err);
				console.info(`remove node(${path}) error: `, error);
				// remove children ndoe
				module.exports.list(path, (nodes) => {
					var cnode_count = nodes.length;
					nodes.map((node) => {
						var cpath = path[path.length-1] != '/' ? path + '/' + node :  path.substr(0,path.length-1) + node;
						module.exports.delR(cpath, -1, ()=> {
							cnode_count--;
							if (cnode_count == 0) {
								module.exports.del(path, version);
								callback && callback();
							}
						});
					})

				})
			}
		}
	)
};


module.exports.createNode = function(path) {
	zk.create(
		path,
		'',
		ZK.create.NONE,
		function (err, path) {
			if (!err) {
				console.log(path, 'was created')
			} else {
				console.log(path, 'create success')
			}

		}
	)
};



var ErrorCode = {
	Ok:  0,
	SystemError:  -1,
	RuntimeInconsistency:  -2,
	DataInconsistency:  -3,
	ConnectionLoss:  -4,
	MarshallingError:  -5,
	Unimplemented:  -6,
	OperationTimeout:  -7,
	BadArguments:  -8,
	APIError:  -100,
	NoNode:  -101,
	NoAuth:  -102,
	BadVersion:  -103,
	NoChildrenForEphemerals:  -108,
	NodeExists:  -110,
	NotEmpty:  -111,
	SessionExpired:  -112,
	InvalidCallback:  -113,
	InvalidACL:  -114,
	AuthFailed:  -115
};
