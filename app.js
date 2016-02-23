/**
 * Created by ksh on 16/1/15.
 */
//var HelloMessage = React.createClass({
//    render: function() {
//        return <h1>Hello {this.props.name}</h1>;
//    }
//});
//
//ReactDOM.render(
//<HelloMessage name="John" />,
//    document.getElementById('example')
//);
//
//
//var MyTitle = React.createClass({
//    propTypes: {
//        title: React.PropTypes.string.isRequired,
//    },
//
//
//
//    render: function() {
//        return <h1> {this.props.title} </h1>;
//    }
//});
//
//
//var data = "12312";
//
//ReactDOM.render(
//    <MyTitle title={data} />,
//    document.body
//);
var fs = require("fs");
var React = require('react');
var ReactDOM = require('react-dom');
var Reflux = require('reflux');

var jquery = require('jquery');
window.jQuery = jquery;
console.log(jquery('#example'));

var bootstrap = require('bootstrap');
var brace = require('brace');
require('brace/mode/json');
require('brace/theme/github');
var AceEditor = require('react-ace');

var Dialogs = require('dialogs');

var remote = require('remote');
var zkUtil = remote.require('./zkUtil');

import { ContextMenu, MenuItem, ContextMenuLayer } from "react-contextmenu";

var _isEditedState = false;
var managerBarAction = Reflux.createActions(['changeEditState', 'saveData']);

var isEditedStore = Reflux.createStore({
    init: function() {
        this.listenTo(managerBarAction.changeEditState, this.onChange);
    },
    onChange: function() {
        _isEditedState = !_isEditedState;
        this.trigger(_isEditedState);
    },
    getState: function() {
        return _isEditedState;
    }
});


var NodeListItem = ContextMenuLayer("some_unique_identifier", (props) => {
	return {
		nodeList: props.nodeList,
		repo: props.repo
	};
})(React.createClass({
	render: function() {
		return (<li key={this.props.repo}>
			<a href='#' onClick={this.props.nodeList.handleClick}>{this.props.repo}</a>
		</li>)
	}
}));

var NodeList = React.createClass({
    getInitialState: function() {
        return { path: "/", children: [], value: undefined, isReadOnly: !isEditedStore.getState()};
    },

    componentDidMount() {
        console.log('componentDidMount');
        var path = this.props.path;
        var $this = this;
        zkUtil.list(path, function(data){
            zkUtil.get(path, function(value){
                $this.setState({children: data, value: value});
            });
        });
        this.unsubscribe = isEditedStore.listen(this.isEditChange);
		this.saveDataUnsubscribe = managerBarAction.saveData.listen(this.saveData);
    },
    componentWillUnmount: function() {
        this.unsubscribe();
		this.saveDataUnsubscribe();
    },
    componentWillReceiveProps(nextProps){
        console.log('componentWillReceiveProps');
        console.log(nextProps);
        var $this = this;
        if(nextProps.path != this.state.path) {
            zkUtil.list(nextProps.path, function(data){
                zkUtil.get(nextProps.path, function(value){
                    console.log('value', value);
                    $this.setState({children: data, value: value});
                });
            });
        }
    },
    isEditChange: function() {
        this.setState({isReadOnly: !isEditedStore.getState()});
		if(!this.state.isReadOnly) {
			this.refs.aceEditor.editor.focus();
		}
    },
	onChange: function(value) {
		this.state.value = value;
	},
	saveData: function() {
		console.log('saveData: ' + this.state.value);
		if(this.state.value.length && confirm('是否要保存将会 覆盖')) {
			zkUtil.set(this.state.path, this.state.value)
		}
	},
    handleClick: function(e) {
        console.log('handleClick');
		this.goToNode(e.target.text)
    },
	goToNode: function(repo) {
		var path = this.props.path + (this.props.path =='/' ? '' : '/') + repo;
		var $this = this;
		console.log(path);
		zkUtil.list(path, function(data){
			console.log({path: path, children: data});
			zkUtil.get(path, function(value){
				$this.setState({path: path, children: data, value: value});
			});
			$this.props.setPath(path);
		});
	},
	delNode: function(repo) {
		var path = this.props.path + (this.props.path =='/' ? '' : '/') + repo;
		if(confirm(`是否要删除 ${path} 将无法恢复`)) {
			var $this = this;
			console.log('delNode:' + path);
			zkUtil.delR(path, -1, () => {
				$this.componentDidMount()
			});
		}
	},
    render: function() {
        var repos = this.state.children;
        var $this = this;
        var reposReacts = null;
        var editReacts = null;
        if (repos && repos.length > 0) {
            reposReacts = (<ol>
                {
                    repos.map(function (repo, i) {
                        return (
							<NodeListItem repo={repo} key={i} nodeList={$this} />
                        )
                    })
                }
            </ol>)
        }

        if (this.state.value && this.state.value.length || !this.state.isReadOnly) {
			var value = this.state.value + "";
			try {
                value = JSON.stringify(JSON.parse(value), null ,4);
			} catch (err) {
				console.log(err);
			}
            editReacts = (
                <AceEditor
                    ref="aceEditor"
                    mode="json"
                    theme="github"
                    tabSize={4}
                    readOnly={this.state.isReadOnly}
                    value={value}
                    onChange={this.onChange}
                    width="720px"
                    editorProps={{$blockScrolling: true}}
                    />
			)
        }

        return (
            <main>
                {reposReacts}
                {editReacts}
            </main>
        )
    }
});



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
