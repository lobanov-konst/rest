/**
 * Created by developer on 27.10.15.
 */

var express = require('express');
var FSTO = require('./lib/fsto');
var cheerio = require('cheerio');

var app = express();
app.set('json spaces', 4);
app.listen(3000);

app.get('/search/:text', function(req, res) {
    var data = {
        'error': 'false',
        'route': req.route.path,
        'path': __dirname,
        'ip': req.ip,
        'hostname': req.hostname,
        'params': req.params
    };

    res.json(data);
})

app.get('/video/films/', function(req, res) {
    //var path = '/video/films/i4qyDMtRZFuZspzPXBLTJ1S-mister-kholms.html?ajax&folder=0&r=' + Math.random();
    //var start = new Date(), end = 0;
    var path = '/video/films/',
        data = {
            'nowViewed': {'list': []},
            'films': {'list': []}
        };
    // Go ahead only if query has page parameter.
    if (Object.keys(req.query).length && !req.query.page) {
        res.status(404);
        res.send('Wrong query');
        return;
    } else if (req.query.page && req.query.page > 0) {
        path = req.originalUrl;
    }

    FSTO.getPage(path, function(content) {
        $ = cheerio.load(content);

        // Parse most viewed
        var $viewedList = $('.b-nowviewed__posters .b-poster-new a');
        $viewedList.each(function(id, val) {
            var $a = $(val),
                $imageSpan = $a.find('.b-poster-new__image-poster'),
                $fullTitle = $a.find('.m-poster-new__full_title');

            data['nowViewed']['list'].push({
                path: $a[0].attribs.href,
                image: ($imageSpan["0"].attribs.style).match(/http.[^')]*/i)[0],
                title: $fullTitle.text(),
            });
        });

        // Parse films section
        var $sectionList = $('.b-section-list .b-poster-tile a');
        $sectionList.each(function(id, val) {
            var $a = $(val),
                $img = $a.find('img'),
                $info = $a.find('.b-poster-tile__title-info-items'),
                $votePositive = $a.find('.b-poster-tile__title-info-vote-positive'),
                $voteNegative = $a.find('.b-poster-tile__title-info-vote-negative');

            data['films']['list'].push({
                path: $a[0].attribs.href,
                image: $img[0].attribs.src,
                title: $img[0].attribs.alt,
                info: $info.text(),
                votePositive: $votePositive.text(),
                voteNegative: $voteNegative.text()

            });
        });

        //end = new Date();
        //console.log('--> Exec time: ' + (end - start) + ' ms');
        res.status(200).json(data);
    });
});

app.get('/video/films/:id.html', function(req, res) {

    var $,
        path = '/video/films/' + req.params.id + '.html',
        data = {
            'nowViewed': {'list': []},
            'films': {'list': []}
        },
        folder = {};

    if (Object.keys(req.query).length) {
        // Parse details
        if (req.query.folder) {

            console.log('parse folder');
        }
        //console.log('with params');
    } else {
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

                var proccess = {
                    language: 1,
                    translation: 1,
                    allTranslation: 0
                };
                var ajaxLanguageLink = data.baseUrl + '?ajax&folder=0&r=' + Math.random();
                FSTO.getPage(ajaxLanguageLink, function(content) {
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

                    // Get translations
                    data.folders.forEach(function(folder) {
                        ajaxLanguageLink = data.baseUrl + '?ajax&folder=' + folder.parentId + '&r=' + Math.random();
                        FSTO.getPage(ajaxLanguageLink, function(content) {
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
                                proccess.allTranslation++;
                            });


                            if (proccess.language++ == data.folders.length) {

                                // Get files
                                data.folders.forEach(function(folder, id) {
                                    folder.translations.forEach(function(translation) {
                                        ajaxLanguageLink = data.baseUrl + '?ajax&folder=' + translation.parentId + '&r=' + Math.random();
                                        FSTO.getPage(ajaxLanguageLink, function(content) {
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
                                            if ((proccess.translation++ == proccess.allTranslation)) {
                                                res.status(200).json(data);
                                            }
                                        })
                                    });
                                });
                            }
                        });
                    });
                })
            }
        );
    }
});


app.use(function(req, res) {
    res.status(404).send('Page Not Found');
    //res.sendStatus(404);
});
