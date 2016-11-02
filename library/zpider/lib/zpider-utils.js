
module.exports.copy = exports.copy = function(obj) {
	var copy = {};
	for(key in o){
		copy[key] = o[key];
	}
	return copy;
}