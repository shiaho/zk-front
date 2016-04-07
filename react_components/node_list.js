var React = require('react');
var Reflux = require('reflux');

import {managerBarAction, isEditedStore} from './../reflux_components/manager_bar';
//var reflux_com = require('./../reflux_components/manager_bar');
//var managerBarAction = reflux_com.managerBarAction;
//var isEditedStore = reflux_com.isEditedStore;

var NodeListItem = require('./node_list_item');

var remote = require('remote');
var zkUtil = remote.require('./zkUtil');

var brace = require('brace');
require('brace/mode/json');
require('brace/theme/github');
var AceEditor = require('react-ace');
var name = "Bob", time = "today";
console.log(`Hello ${name}, how are you ${time}?`);
module.exports = React.createClass({
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
