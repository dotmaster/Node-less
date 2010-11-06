var less = require('less'),
    path = require('path'),
      fs = require('fs'),
     sys = require('sys');
var exports;
//if started from commandline filenames must be called .less.css
var command=process.ARGV[1];
var lastPath=path.basename(command);
if (typeof lastPath != "undefined" && lastPath!=null && typeof lastPath=="string"){
  if (lastPath=="node-less.js"){ //called from command line
    console.log("[INFO] node-less called from command line");
    exports.cl=true;  
    //get the arguments and call handle
    var arguments=process.ARGV.slice(2);//slice away the first two parameters, the rest are arguments
    if (arguments.length==0){console.log("[ERROR] Please provide at least one file to parse");return;}
    arguments.forEach(function(argument){
      //do some checking her
      if (path.extname(argument)!==".less"){
        console.log("[ERROR] The filename should end with .less or .less.css");
        return;
      }
    });
    handle(arguments);
  }else{
    console.log("[INFO] node-less called as Module")
    exports.cl=false;    
  }
}
exports.handle = handle;
function handle (inputArr, options, callback) { //takes a filename Array, some options and a clallback
  //callback (parsed css output Array)
  
  options = options || {};
  var cl=exports.cl;
  var outputArr=[];
  function respondError(msg) {
    if(cl){
      console.log("[ERROR] LESS.js Error: "+msg);
    }else{
      addError("[ERROR] LESS.js Error: "+msg);
    }
  }
  
  inputArr.forEach(function(input, index, inputArr){
    outputArr[index]={};
    inputArr[index]=input=input.replace(/\.css$/, ""); //if the file name is .less.css make it .less
    fs.stat(input, function (e, stats) {
      if (e) {
        respondError("File Not Found "+e);
      }
      fs.open(input, 'r', stats.mode, function (e, fd) { 
        fs.read(fd, stats.size, 0, "utf8", function (e, data) {
          new(less.Parser)({
            paths: [path.dirname(input)],
            filename: input
          }).parse(data, function (err, tree) {
            if (err) {
              respondError(err)
            } else {
              try {
                var css = tree.toCSS({ compress: options.compress });
                handleResponse(css);
                //response.end(css);
              } catch (e) {
                respondError(e)
              }
            }
          });
        });
      });
      function handleResponse(css){
        if (cl){//if we were called from the command line wrtie out a file
          writeToFile(css)
        }else{
          addToResponse(css)
        }
        function writeToFile(css){//write the file as .less.css
          var buf=new Buffer(css, encoding='utf8')
          fs.open(input+".css", 'w', stats.mode, function (e, fd) {
            fs.write(fd, buf, 0, buf.length, 0, function(err, written){
              if (err) {
                respondError(err)
              }
              fs.close(fd, function(err){
                if (err) {
                  respondError(err)
                }                       
              })
            })
          })        
        }
        function addToResponse(css){
          ouput=ouputArr[index];
          ouput.css=css;
          ouputArr[index]=ouput;
        }
      }      
    });
    function addError(msg){
      errors=ouputArr[index].errors;
      if(errors){errors.push("LESS.js Error: "+msg)}else{errors=[];}
      ouputArr[index]={css:null, errors:errors}
    }
  });
  if (!cl&&typeof callback=="function"){
    callback(ouputArr);    
  }else if (typeof callback=="function"){
    throw Error("callbacks are not supported for Command line use. This shouldn't happen!");
  }
}