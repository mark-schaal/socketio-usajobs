var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var request = require('request');
var xml2js = require('xml2js');

var parser = new xml2js.Parser(); //Per documentation, only create one parser object per file.

app.get('/', function(req, res){
	var options = {
		root: __dirname+'/public',
	};
	res.sendFile('index.html',options);
});

io.on('connection', function(socket){
	//Bind User Connection Behaviors
		// Get optional filters from USAJobs schema to prepopulate form
		request('https://schemas.usajobs.gov/Enumerations/OccupationalSeries.xml', function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var results;
				//Convert XML Response to JSON and parse results from custom property requirements
				parser.reset();
				parser.parseString(body, function (err, result) {
					//Grab Results for the CodeList item with the ID of OccupationSeriesFamily
					data = result.CodeLists.CodeList;
					for(var property in data){
						//Presumes that the attrkey defaults to $
						if(data[property].$.id == 'OccupationSeriesFamily'){
							result = data[property];
						}
					}
					fs.writeFile('test.json',JSON.stringify(result));
					results = result;
				});

				//Pump Available Options into Web Interface Search Form
				io.emit('job search series options',results.ValidValue);

				//Debugging Purposes
				// for(var key in results.ValidValue){
				// 	console.log(results.ValidValue[key].Value,results.ValidValue[key].JobFamily);
				// }
			}
		})

	//Bind User Disconnect Behaviors
	socket.on('disconnect',function(){
		console.log('User socket disconnection detected.');
	});

	//Bind Custom Event Messaging Behaviors
	socket.on('job search',function(search){
		var options = {
			url: 'https://data.usajobs.gov/api/jobs?series=2210',
			headers: {
				'Content-Type': 'application/json'
			}
		};
		function callback(error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log(response);
				console.log(body);
			}
			console.log('Search initialized from external endpoint: '+search);
			io.emit('job search',search);
		};
		request(options,callback);
	});
});

http.listen(3000, function(){
	console.log('Server instantiated and listening on *:3000');
});
