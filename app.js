/**
 * Created by developer on 27.10.15.
 */

var express = require('express');
var cheerio = require('cheerio');
var http = require('http');
var app = express();
app.listen(3000);

app.get('/users', function(req, res) {
    //fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
    //    console.log( data );
    var data = {
        'error': 'false',
        'route': req.route.path,
        'path': __dirname,
    };

    res.json(data);
    //res.redirect('//google.com');
})

app.get('/search/:text', function(req, res) {
    //fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
    //    console.log( data );
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

var start, end;

app.get('/', function(req, res) {
    start = new Date();
    var _res = res;
    if (req.query.search) {
        // 1. -----------------------------------
        var options = {
            host: "fs.to",
            port: 80,
            path: "/"
        };
        var content = "";
        var _req = http.request(options, function(res) {
            res.setEncoding("utf8");
            res.on("data", function(chunk) {
                content += chunk;
            });
            res.on("end", function() {
                //console.log(content);
                $ = cheerio.load(content);
                var $items = $('.m-main__subsection_theme_m-video');

                //var _temp = {};
                //$items.each(function(indx, element) {
                //    _temp[indx] = element.attribs['href'];
                //});


                _res.send({'content': 'true'});
                end = new Date();
                console.log('Exec time: ' + (end - start) + ' ms');
            });
        });

        _req.end();
        // --------------------------------------


        //http.get("http://fs.to", function(res) {
        //    console.log("Got response: " + res.statusCode);
        //}).on('error', function(e) {
        //    console.log("Got error: " + e.message);
        //});
    }


    //fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
    //    console.log( data );

    //res.json({'error': 'false'});
})

app.use(function(req, res) {
    res.status(404).send('Page Not Found');
    //res.sendStatus(404);
});
