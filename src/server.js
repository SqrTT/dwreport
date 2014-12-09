var express = require('express'),
	app = express(),
	_ = require('lodash'),
	serveStatic = require('serve-static'),
	cookieSession = require('cookie-session'),
	Datastore = require('nedb'),
	bodyParser = require('body-parser'),
	db = new Datastore({
		filename : './workdir/main.db',
		autoload : true
	}),
	validator = require('./main');

app.use(serveStatic('public'));

app.use(cookieSession({
	keys : ['LkudfoifdsdFKJ', 'llKDIFuLKDFNLLKW']
}));
app.use(bodyParser.json());

app.get('/projects.json', function (req, res) {
	db.find({
		docName : 'projects'
	}, function (err, doc) {
		res.send(JSON.stringify(doc));
	});
});
var cachedResult = {};

app.get('/output/:id', function (req, res) {

	db.find({
		docName : 'projects',
		projectID : req.params.id
	}, function (err, doc) {
		if (err || !doc) {
			res.send(JSON.stringify({success: false, reason: 'no project found'}));
		} else {
			if (cachedResult[req.params.id]) {
				res.send(JSON.stringify({success : true, data : cachedResult[req.params.id]}));
			} else {
				var paths = doc[0].paths.split(';');
				try {
					validator.validate(paths, {}, function (result) {
						result.total = validator.calcTotals(result);
						cachedResult[req.params.id] = result;
						res.send(JSON.stringify({success : true, data : result}));
					});
				} catch (e) {
					res.send(JSON.stringify({success : false, data : e}));
				}
			}
		}
	});
});

app.post('/project', function (req, res) {
	var project = {
		docName : 'projects'
	};
	_.each(req.body, function (param) {
		project[param.name] = param.value;
	});
	db.find({
		docName : 'projects',
		projectID : project.projectID
	}, function (err, doc) {
		if (_.isEmpty(doc)) {
			db.insert(project, function (err, nDoc) {
				res.send(JSON.stringify(nDoc));
			});
		} else {
			db.update({
				docName : 'projects',
				projectID : project.projectID
			}, project, function (err, nDoc) {
				res.send(JSON.stringify(nDoc));
			});
		}
	});
});

var server = app.listen(8888, function () {
	var host = server.address().address,
		port = server.address().port;

	console.log('App listening at http://%s:%s', host, port);
});
