var http = require('http');

var options = {
    host: "fs.to",
    port: 80,
    headers: {
        "User-Agent": "Mozilla/5.0",
    },
    path: '/'
};

function FSTO() {
}

FSTO.prototype.getPage = function(path, callback) {
    options.headers['User-Agent'] = userAgent();
    options.path = path;
    //console.log(options.headers['User-Agent']);
    var content = "",
    //start = new Date(), end = 0,
        req = http.request(options, function(res) {
            res.setEncoding("utf8");
            res.on("data", function(chunk) {
                content += chunk;
            });
            res.on("end", function() {
                if (typeof callback == 'function') {
                    callback(content);
                }
                //end = new Date();
                //console.log('--> Exec time: ' + (end - start) + ' ms');
            });
        });


    req.end();
};

function userAgent() {
    var list = [
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36',
        'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:41.0) Gecko/20100101 Firefox/41.0',
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11) AppleWebKit/601.1.56 (KHTML, like Gecko) Version/9.0 Safari/601.1.56',
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36',
        'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
        'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:41.0) Gecko/20100101 Firefox/41.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.7 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.7',
    ];
    return list[Math.floor(Math.random() * 11)];
};

module.exports = new FSTO();



