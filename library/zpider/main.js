const routes = require('routes');
const EventEmitter = require('events').EventEmitter;
const util = require('util');

const urlParse = require('url').parse;
const urlResolve = require('url').resolve;

const cookieJar = require('cookiejar');
const request = require('request');
const cheerio = require('cheerio');

const cache = require('./lib/zpider-cache');
const agent = require('./lib/zpider-agent');
const tool = require('./lib/zpider-utils');

/**
 * constructor
 */ 
var Zpider = function(options){
	options = typeof options === 'object'? options : {};

	this.userAgent = options.userAgent || agent.FirefoxUserAgent;
	this.routes = {};
	this.urls = [];
	this.cache = options.cache || cache.NO_CACHE();
	this.cookieJar = cookieJar.CookieJar();
}

util.inherits(Zpider, EventEmitter);

Zpider.prototype.route = function (host, pattern, callback) {
	var self = this;
	if (typeof host === 'string') {
		if (self.routes[host] === undefined) {
			self.routes[host] = new routes.Router();
		}
		self.routes[host].addRoute(pattern, callback);
		self.emit('__log', 'info', 'Add host[' + host + '] router. with pattern[' + pattern + ']');
	} else {
		self.emit('__log', 'warn', 'Try to call Zpider.route() with unkonwn host [' + host + ']');
	}
}

Zpider.prototype.fetch = function(url, referer) {

}

Zpider.prototype.__handler = function (url, referer, response) {

}