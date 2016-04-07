/**
 * Created by ksh on 16/1/15.
 */
var fs = require("fs");
var jquery = require('jquery');
window.jQuery = jquery;

var bootstrap = require('bootstrap');
var Dialogs = require('dialogs');

var remote = require('remote');
var zkUtil = remote.require('./zkUtil');

var React = require('react');
var ReactDOM = require('react-dom');
var Reflux = require('reflux');
require('babel-core');
require('babel-register');

import { ContextMenu, MenuItem, ContextMenuLayer } from "react-contextmenu";
import { managerBarAction, isEditedStore } from './reflux_components/manager_bar';

var NodeList = require('./react_components/node_list');

//The context-menu to be triggered
const MyContextMenu = React.createClass({
	render() {
		return (
			<ContextMenu identifier="some_unique_identifier" currentItem={this.currentItem}>
				<MenuItem data={{item: "open"}}  onSelect={this.handleSelect}>
					Open
				</MenuItem>
				<MenuItem divider />
				<MenuItem data={{item: "remove"}} onSelect={this.handleSelect}>
					Remove
				</MenuItem>
			</ContextMenu>
		)
	},
	handleSelect(data, item) {
		console.log(data, item);
		switch (data.item){
			case 'open':
				data.nodeList.goToNode(data.repo);
				break;
			case 'remove':
				data.nodeList.delNode(data.repo);
				break;
		}
	}
});

var mkdirP = function(path, callback) {
	var pdir = path.substr(0, path.lastIndexOf('/'));
	fs.exists(pdir, (exisets) => {
		if (exisets) {
			console.log('mkdir: ' + path);
			fs.mkdir(path, callback);
		} else {
			mkdirP(pdir, () => {
				console.log('mkdir: ' + path);
				fs.mkdir(path, callback);
			})
		}
	});
};

var MainBoard = React.createClass({
    getInitialState: function() {
        return { path:  this.props.path || '/gateway'};
    },
    back: function() {
        var newPath = this.state.path.slice(0, this.state.path.lastIndexOf('/'));
        console.log(newPath);
        if(newPath == '') newPath = '/';
        this.setState({path: newPath});
    },
    edit: function() {
        managerBarAction.changeEditState();
    },
	save: function() {
		managerBarAction.saveData();
	},
    add: function() {
        var dialogs = new Dialogs();
        var $this = this;
        dialogs.prompt('请输入新节点名', function(name) {
            console.log('prompt', name);
            if(name) {
                zkUtil.createNode($this.state.path + ($this.state.path=='/'?'':'/') + name)
            }

        });
    },
	exportData: function() {
		var $this = this;
		var pathPerfix = '/Users/ksh';
		zkUtil.list($this.state.path, function(data){
			for(var i in data) {
				var host = data[i];
				var path = $this.state.path + ($this.state.path =='/' ? '' : '/') + host;

				(function (path) {
					var dirPath =  pathPerfix + path.substr(0,path.lastIndexOf('/'));
					var filePath = pathPerfix + path + '.yaml';
					fs.exists(dirPath, (exisets) => {
						var cb = () => {
							console.log('write file');
							zkUtil.get(path, function(value){
								fs.writeFileSync(filePath , value, {flag: 'w+'});
							});
						};
						if (exisets) {
							cb();
						} else {
							mkdirP(dirPath, cb);
						}
					});

				})(path);

			}

		});

	},
    updatePath: function(path) {
        this.setState({path: path});
    },
    render: function() {
        return (
            <div>
				<div className="btn-group">
					<a className="btn btn-default glyphicon glyphicon-arrow-left" onClick={this.back}></a>
					<a className="btn btn-default glyphicon glyphicon-edit" onClick={this.edit}></a>
					<a className="btn btn-default glyphicon glyphicon-floppy-disk" onClick={this.save}></a>
					<a className="btn btn-default glyphicon glyphicon-plus" onClick={this.add}></a>
					<a className="btn btn-default glyphicon glyphicon-download-alt" onClick={this.exportData}>exportData</a>
				</div>
				<h1>{this.state.path}</h1>
                <NodeList path={""+this.state.path} setPath={this.updatePath} />
				<MyContextMenu />
            </div>
        )
    }

});

ReactDOM.render(
    <MainBoard path="/" />,
    document.getElementById('example')
);
