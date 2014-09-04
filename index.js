var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var request = require('request');

app.get('/', function(req, res){
	var options = {
		root: __dirname+'/public',
	};
	res.sendFile('index.html',options);
	request('https://data.usajobs.gov/api/jobs?series=2210').pipe(fs.createWriteStream('test.json'));
});

io.on('connection', function(socket){
	console.log('User socket connection detected.');
	socket.on('disconnect',function(){
		console.log('User socket disconnection detected.');
	});
	socket.on('chat message',function(msg){
		console.log('Message processed: '+msg);
		io.emit('chat message',msg);
	});
});

http.listen(3000, function(){
	console.log('Server instantiated and listening on *:3000');
});
