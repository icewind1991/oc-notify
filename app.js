var watch = require('node-watch'),
	fs = require('fs'),
	spawn = require('child_process').spawn;

var rootDir = process.argv[2];

var scriptPath = rootDir + '/apps/files/triggerupdate.php';
var config = '' + fs.readFileSync(rootDir + "/config/config.php");

var regex = /\'datadirectory\' ?=> ?\'([^\']+)'/;

var queue = [];

var handleQueue = function () {
	if (queue.length && !handleQueue.running) {
		handleQueue.running = true;
		var item = queue.shift();
		handleItem(item, function () {
			handleQueue.running = false;
			handleQueue();
		});
	}
};
handleQueue.running = false;

var handleItem = function (path, cb) {
	console.log('triggering update for ' + path);
	var prc = spawn('php', [scriptPath, path]);
	prc.on('close', cb);
};

match = config.match(regex);
if (match) {
	var datadir = match[1];
	console.log('Found datadir: ' + datadir);
	watch(datadir, { recursive: true, followSymLinks: false }, function (path) {
		var ocPath = path.substr(datadir.length);
		var parent = ocPath.substr(0, ocPath.lastIndexOf('/'));
		if (queue.indexOf(parent) === -1) {
			queue.push(parent);
			handleQueue();
		}
	});
} else {
	console.log('Error parsing ownCloud config file');
}
