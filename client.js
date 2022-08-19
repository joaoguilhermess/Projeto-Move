const net = require("net");
const fs = require("fs");
const stream = require("stream");

const Port = 6000;
const Host = "192.168.0.107";

var client = new net.Socket();

client.connect(Port, Host);

client.on("connect", function() {
	var args = process.argv.slice(2);
	var name = args[0];

	console.log("Sending File:", name);

	client.write(name.replaceAll(" ", ">"));

	var fileStream = fs.createReadStream(name);	

	stream.pipeline(fileStream, client, function(e) {
		if (!e) {
			console.log("File Sent:", name);
			client.end();
			fileStream.close();
		} else {
			console.log("error", e);
		}
	});
});