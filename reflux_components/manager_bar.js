
var Reflux = require('reflux');

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

module.exports.managerBarAction = managerBarAction;
module.exports.isEditedStore = isEditedStore;
