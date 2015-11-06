var http = require('http');
var cheerio = require('cheerio');
var redis = require('redis'),
    client = redis.createClient();

var options = {
    host: "fs.to",
    port: 80,
    headers: {},
    path: '/'
};

var FSTO = {};

FSTO.getPage = function(path, callback) {
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

FSTO.parseContent = function(path, callback) {
    client.get(path, function(err, reply) {
        if (!reply) {
            parseContent(path, function(result) {
                parseLanguages(result.data, function(result) {
                    parseTranslations(result.data, result.data.folders.length, function(result) {
                        parseFiles(result.data, result.translationsCount, function() {
                            client.set(path, JSON.stringify(result));
                            client.expire(path, parseInt((+new Date) / 1000) + 3600);
                            callback(result);
                        });
                    });
                });
            });
        } else {
            callback(eval('(' + reply + ')'));
        }
    });
};

function parseContent(path, callback) {
    var data = {};

    FSTO.getPage(path, function(content) {
            console.log('get content');
            $ = cheerio.load(content);
            var $content = $('.l-tab-item-content'),
                $posterUrl = $content.find('.poster-main img'),
                $title = $content.find('.b-tab-item__title-inner span'),
                $titleOrigin = $content.find('.b-tab-item__title-origin'),
            //$itemInfo = $content.find('.item-info tr'),
                $fileList = $content.find('#page-item-file-list a'),
                $itemRel = eval('(' + $fileList[0].attribs.rel + ')');
            data = {
                'itemId': $itemRel.item_id,
                'baseUrl': $itemRel.baseurl,
                'imageUrl': $posterUrl[0].attribs.src,
                'title': $title.text().trim(),
                'titleOrigin': $titleOrigin.text().trim(),
                'folders': []
            };
            callback({'data': data});
        }
    );
};

function parseLanguages(data, callback) {
    var pageUrl = data.baseUrl + '?ajax&folder=0&r=' + Math.random();
    FSTO.getPage(pageUrl, function(content) {
        console.log('get languages');
        $ = cheerio.load(content);
        var $folders = $('.folder div a');
        $folders.each(function(id, val) {
            var $folder = $(val),
                rel = eval('(' + $folder[0].attribs.rel + ')');
            data.folders.push({
                'title': $folder.text().trim(),
                'name': $folder[0].attribs.name,
                'parentId': rel.parent_id,
                'translations': []
            });
        });
        callback({'data': data});
    });
};

function parseTranslations(data, count, callback) {
    var pageUrl, languageParsed = 1, translations = 0;
    data.folders.forEach(function(folder) {
        pageUrl = data.baseUrl + '?ajax&folder=' + folder.parentId + '&r=' + Math.random();
        FSTO.getPage(pageUrl, function(content) {
            console.log('get translations');
            $ = cheerio.load(content);
            var $folders = $('.folder div a.title');
            $folders.each(function(id, val) {
                var $folder = $(val);
                var rel = eval('(' + $folder[0].attribs.rel + ')');
                folder.translations.push({
                    'title': $folder.text().trim(),
                    'name': $folder[0].attribs.name,
                    'parentId': rel.parent_id,
                    'files': []
                });
                translations++;
            });
            if (languageParsed++ == count) {
                callback({'data': data, 'translationsCount': translations});
            }
        });
    });
};

function parseFiles(data, count, callback) {
    var pageUrl, translationParsed = 1;
    data.folders.forEach(function(folder, id) {
        folder.translations.forEach(function(translation) {
            pageUrl = data.baseUrl + '?ajax&folder=' + translation.parentId + '&r=' + Math.random();
            FSTO.getPage(pageUrl, function(content) {
                console.log('get files');

                $ = cheerio.load(content);
                var $items = $('li');
                $items.each(function(id, val) {
                    var $item = $(val),
                        $quality = $item.find('span.video-qulaity'),
                        $downloadLink = $item.find('a.b-file-new__link-material-download');
                    translation.files.push({
                        'quality': $quality.text().trim(),
                        'url': $downloadLink[0] ? $downloadLink[0].attribs.href : '',
                    });
                });
                if ((translationParsed++ == count)) {
                    callback({'data': data});
                    //res.status(200).json(data);
                }
            })
        });
    });
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

module.exports = FSTO;



