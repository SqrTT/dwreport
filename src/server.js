var express = require('express'),
	app = express(),
	_ = require('lodash'),
	serveStatic = require('serve-static'),
	cookieSession = require('cookie-session'),
	Datastore = require('nedb'),
	bodyParser = require('body-parser'),
	db = new Datastore ({
		filename : './workdir/main.db',
		autoload : true
	});

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

	console.log('Example app listening at http://%s:%s', host, port);
});
