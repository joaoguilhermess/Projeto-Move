const net = require("net");
const fs = require("fs");
const stream = require("stream");

const FilesPath = "./files/";
const Port = 6000;

var app = net.createServer(function (socket) {
	if (!fs.existsSync(FilesPath)) {
		fs.mkdirSync(FilesPath);
	}

	socket.on("data", function(data) {
		if (!socket.file) {
			var args = data.toString().split(" ");
			socket.file = args[0].replaceAll(">", " ");
			
			console.log("Receiving File:", socket.file);

			socket.fileStream = fs.createWriteStream(FilesPath + socket.file);

			socket.fileStream.write(args.slice(1).join(" "));
		} else {
			socket.fileStream.write(data);
		}
	});

	socket.on("end", function() {
		console.log("File Received:", socket.file);
		socket.fileStream.close();
	});
});

app.listen(Port, function() {
	console.log("Ready");
});