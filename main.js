var Spider = require('./library/spider');
var spider = Spider();

spider
	// list handler
	// instance: http://www.mkv99.com/vod-search-pg-2-wd-%E7%94%9F%E6%B4%BB%E5%A4%A7%E7%88%86%E7%82%B8.html
	.route("www.mkv99.com", /^\/vod-search-wd-(%\w+)+\.html$/, function($){
		$("div.searchEndList ul li h2 a").spider();
		$("div.searchEndPage a").spider();
	})
	.route("www.mkv99.com", /^\/vod-search-pg-(\d+)-wd-(%\w+)+\.html$/, function($){
		$("div.searchEndList ul li h2 a").spider();
		$("div.searchEndPage a").spider();
	})

	// details handler
	// instance: vod-detail-id-12272.html
	.route("www.mkv99.com", /^\/vod-detail-id-(\d+).html$/, function($){
		$(".downurl script").each(function(){
			var html = $(this).html();
			var regexp = /(ed2k:\/\/\|file\|[a-zA-Z0-9%.\-_\u4E00-\u9FA5]+\|\d+\|[a-zA-Z0-9]+(\|[a-zA-Z0-9=:\/]+)?\|\/)/;
			var ret = regexp.exec(html);
			if (null != ret) {
				console.log(ret[0]);
			}
		})
	})
	.showLog('info');

module.exports = exports = function(keyword){
	var encoded = encodeURIComponent(keyword);
	spider.request("http://www.mkv99.com/vod-search-wd-" + encoded + ".html");
}
