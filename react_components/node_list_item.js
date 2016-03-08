var React = require('react');
var ContextMenuLayer = require('react-contextmenu').ContextMenuLayer;

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

module.exports = NodeListItem;
