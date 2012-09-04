const ROOT_DIR = __dirname + "/",
	MVC_DIR = ROOT_DIR + "mvc/";

var fs = require("fs"),
	http = require("http"),
	socket = require("socket.io"),
	deferral = require("deferral"),
	execQueue = require("execQueue").execQueue,
	ready = false,
	numModules;

Chatty = {
	modules : {},
	debug : function(data){
		process.stdout.write(data + "\n");
	}
};

fs.readdir(MVC_DIR, function(err, modules){
	if(!err){
		numModules = modules.length;
		
		for(var i = modules.length - 1; i + 1; i--){
			(function(iter){  //This is necessary for the iteration number variable to exist in its own memory address.
				var i = iter,
					exec = new execQueue;
				
				Chatty.debug("Found node " + modules[i] + ".");
				
				exec.push(fs.lstat, MVC_DIR + modules[i], function(err, stat){  //Get the stats for the node, so we can check if it's a directory or not.
					if(stat.isDirectory()){
						exec.next();
					}else{
						Chatty.debug("Ignoring " + modules[i]);
					}
				}).push(fs.lstat, MVC_DIR + modules[i] + "/.ignore", function(err, stat){  //Check for a .ignore file in the directory.
					if(err){
						exec.next();
					}else{
						numModules--;
						
						Chatty.debug("Ignoring module " + modules[i] + ".");
					}
				}).push(fs.lstat, MVC_DIR + modules[i] + "/" + modules[i] + ".js", function(err, stat){  //Check for <module_name>.js
					if(err){
						numModules--;
						
						Chatty.debug("Cannot find " + modules[i] + ".js, skipping module.");  //Oh no, couldn't find it!
					}else{
						Chatty.modules[modules[i]] = require(MVC_DIR + modules[i] + "/" + modules[i] + ".js")[modules[i]];
						
						Chatty.debug("Loaded module " + modules[i] + ".");
					}
				}).exec();
			})(i);
		}
	}else{
		throw "Cannot read " + MVC_DIR + ", bro.";
	}
});

var server = http.createServer(function(request, response){
		
	}).listen(80),
	io = socket.listen(server);

io.sockets.on("connection", function(socket){
	
});

deferral.when(function(){  //Wait until the the process has caught back up before saying the system is ready.
	return Object.keys(Chatty.modules).length === numModules;
}, function(){
	Chatty.debug("All systems go, bro.");
	
	ready = true;
});
