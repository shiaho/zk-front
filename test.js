/**
 * Created by ksh on 16/1/14.
 */
var ZK = require('zkjs');

var zk = new ZK({
    hosts: ['127.0.0.1:2181'],
    root: '/'
});


zk.start(function (err) {

    //zk.create(
    //    '/foo',
    //    'some ephemeral data',
    //    ZK.create.EPHEMERAL,
    //    function (err, path) {
    //        if (!err) {
    //            console.log(path, 'was created')
    //        }
    //    }
    //)

    //zk.getChildren(
    //    '/gateway',
    //    function (err, children, zstat) {
    //        console.log(children);
    //        if (!err) {
    //            console.log('/', 'has', children.length, 'children')
    //        }
    //    }
    //);

    tree('/gateway');

    //zk.get(
    //    '/some/known/node',
    //    function (watch) {
    //        console.log(watch.path, 'was', watch.type)
    //    },
    //    function (err, value, zstat) {
    //        console.log('the current value is ', value.toString())
    //
    //        zk.set(
    //            '/some/known/node',
    //            'some new data',
    //            zstat.version,
    //            function (err, zstat) {
    //                if (!err) {
    //                    console.log('the new version number is', zstat.version)
    //                }
    //            }
    //        )
    //    }
    //)
});

var tree = function (path) {
    //console.log("getChildren: " + path);
    zk.getChildren(path, function (err, children, zstat) {
        //console.log(err, children, zstat);
        if (err) {
            console.log(err)
        }
        //console.log(path, 'has', children.length, 'children');
        if (!children.length) {
            //console.log("get: " + path);
            zk.get(
                path,
                function (watch) {
                    console.log(watch.path, 'was', watch.type)
                },
                function (err, value, zstat) {
					console.log(path + " value:  " + value);
					try {
						var config  = JSON.parse(value);
					} catch (err) {
						console.log(err)
					}

                }
            )
        }
        for (var i in children) {
            var cpath = (path == '/' ? path : path + '/' ) + children[i];
            //console.log(cpath);
            tree(cpath)
        }

    })
};

