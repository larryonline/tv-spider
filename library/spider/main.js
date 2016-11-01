
var routes = require('routes');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var urlParse = require('url').parse;
var urlResolve = require('url').resolve;
var cookiejar = require('cookiejar');
var request = require('request');
var cheerio = require('cheerio');

var logLevels = {debug:1, info:50, warn:80, error:100, 1:'debug', 50:'info', 80:'warn', 100:'error'}

var headers = {
  'accept': "application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5"
  , 'accept-language': 'en-US,en;q=0.8'
  , 'accept-charset':  'ISO-8859-1,utf-8;q=0.7,*;q=0.3'
}

var FireFoxUserAgent = 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_4; en-US) ' +
              'AppleWebKit/534.7 (KHTML, like Gecko) Chrome/7.0.517.41 Safari/534.7';

function copy(o){
	var copy = {};
	for(key in o){
		copy[key] = o[key];
	}
	return copy;
}

function NoCache () {};
NoCache.prototype.get = function (url, cb) { cb(null) };
NoCache.prototype.getHeaders = function (url, cb) {cb(null)};
NoCache.prototype.set = function (url, headers, body) {};

var Spider = function (options) {
	options = options || {};

	this.userAgent = options.userAgent || FireFoxUserAgent;
	this.routes = {};
	this.urls = [];
	this.cache = options.cache || new NoCache();
	this.cookiejar = cookiejar.CookieJar();
	
}

util.inherits(Spider, EventEmitter);

Spider.prototype.route = function(host, pattern, callback) {
	var self = this;
	if (typeof host === 'string') {
		if(self.routes[host] === undefined) {
			self.routes[host] = new routes.Router();
		}
		self.routes[host].addRoute(pattern, callback);
	} else {
		console.log('unkonwn host: %s', host);
	}
	return self;
}

Spider.prototype.request = function (url, referer) {
	var self = this, header = copy(headers);

	if (self.urls.indexOf(url) >= 0) {
		self.emit('log', 'debug', 'Already received on get request for ' + url + '. skipping.');
		return self;
	}
	self.urls.push(url);

	var u = urlParse(url);
	if (!self.routes[u.host]) {
		self.emit('log', 'warn', 'No routes for host: ' + u.host + '. skipping');
		return self;
	}

	if (!self.routes[u.host].match(u.href.slice(u.href.indexOf(u.host) + u.host.length))) {
		self.emit('log', 'warn', 'No routes for path ' + u.href.slice(u.href.indexOf(u.host) + u.host.length) + '. skipping');
		return self;
	}

	if (referer) {
		header.referer = referer;
	}

	header['user-agent'] = self.userAgent;

	self.cache.getHeaders(url, function(c) {
		if (c) {
			if (c['last-modified']) {
				header['if-modified-since'] = c['last-modified'];
			}
			if(c.etag) {
				header['if-none-match'] = c.etag;
			}
		}

		var cookies = self.cookiejar.getCookies(cookiejar.CookieAccessInfo(u.host, u.pathname));
		if (cookies) {
			header.cookie = String(cookies);
		}

		request.get({
			url: url,
			headers:header,
			pool:self.pool
		}, function(error, response, body){
			self.emit('log', 'debug', 'Response received [' + url + ']');
			self.emit('data', response, url);

			if (response.statusCode !== 200) {
				self.emit('log', 'warn', 'Response StatusCode=' + response.statusCode + ' [' + url + ']');
				return;
			} else if (!response.headers['content-type'] || response.headers['content-type'].indexOf('html') === -1) {
				self.emit('log', 'warn', 'Response Content-Type does not match "html" [' + url + ']');
				return;
			}

			if(response.headers['set-cookie']) {
				try {
					self.cookiejar.setCookies(response.headers['set-cookie']);
				}catch(e){}
			}

			self._handler(url, referer, {headers:response.headers, body:body});
		});
	});
}

Spider.prototype._handler = function (url, referer, response) {
	var u = urlParse(url), self = this;
	if (self.routes[u.host]) {
		var r = self.routes[u.host].match(u.href.slice(u.href.indexOf(u.host) + u.host.length));
		r.spider = self;
		r.response = response;
		r.url = u;

		r.$ = cheerio.load(response.body);

		r.$.fn.spider = function() {
			this.each(function(){
				var h = r.$(this).attr('href');
				if (/^https?:/.test(h)) {
					h = urlResolve(url , h);
				} else if(/^\//.test(h)) {
					h = urlResolve(url, h);
				}
				self.request(h, url);
			})
		}
		r.fn.call(r, r.$);
	}
}

Spider.prototype.showLog = function (level) {
	if (typeof level === 'string') level = logLevels[level];
	this.on('log', function (l, text) {
		if (logLevels[l] >= level) {
			console.log('[' + l + ']', text);
		}
	});
	return this;
}

module.exports = exports = function(options) {
	return new Spider(options || {});
};
