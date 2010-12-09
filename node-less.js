/*
 * Node-Less Node Parser CommonJS Module 0.1
 *
 * Simplified BSD License (@see License)
 * @author        Gregor Schwab
 * @copyright     (c) 2010 Gregor Schwab
 * Usage Command Line: node node-less file1.less file2.less ...
 * Output Command Line: file1.less.css file2.less.css
 * Usage as Module: require(node-less); new NodeLess().parse(inputArr, options, callback);
 * @requires less
 */

(function() {
var less = require('less'),
    path = require('path'),
      fs = require('fs'),
     sys = require('sys');
var exports;
// Establish the root object,`global` on the server.
var root = this;
// Create a safe reference to the nodeless object for use below.
/**
 * Nodeless class.
 * @param {Object} options (optional) currently just if called from commandline cl=true
 * @constructor
 */
var NodeLess=function (options) {
  if (options && typeof options!=="object"){throw Error("NodeLess constructor options is not an Object");}
  this.cl=options.cl||false;
};

/**
 * Call this function to parse less files
 * @param {Array} inputArr Array of filepath strings pointing to the .less files
 * @param {Object} options (optional) of options (not used at the moment)
 * @param {function} callback(css) (optional) a callback to return the parsed css back (only when used as a Module)
 * @throws Error if wrong argument types are given
 */
 
NodeLess.prototype.parse = function (inputArr, options, callback) { //takes a filename Array, some options and a clallback
  //callback (parsed css output Array)
  processArguments(arguments);
  function   processArguments(arguments){
    var args=Array.prototype.slice.call(arguments);
//    console.log(Array.isArray(args))
    if (args.length===0){throw Error("[Exception] no Arguments specified to function parse, you must at least specify one Argument");}
    if (!Array.isArray(args[0])|| args[0].length===0){throw Error("[Exception] first Argument must be a non empty Array of pathnames");}
    //check first parameter
    args[0].forEach(function(arg){
      if (path.extname(arg)!==".less"){throw Error("[Exception] The filename should end with .less");}
    });
    //check (optional) second parameter
    if(args[1]&&typeof args[1]!=="object"){throw Error("[Exception] 2nd parameter must be an Object");}
    //check (optional) third parameter
    if(args[2]&&typeof args[2]!=="function"){throw Error("[Exception] 3rd parameter must be a function");}  
  }
  options = options || {};
  var cl=this.cl;
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
    //inputArr[index]=input=input.replace(/\.css$/, ""); //if the file name is .less.css make it .less
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
                throw e;
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

// Export the nodeless object for **CommonJS**.
if (typeof exports !== 'undefined') exports.NodeLess = NodeLess;
// Export Underscore to the global scope.
root.NodeLess = NodeLess;
// Current version.
NodeLess.VERSION = '0.0.1';

//if started from commandline filenames must be called .less and will be outpu as .less.css
var command=process.ARGV[1];
var lastPath=path.basename(command);
if (typeof lastPath != "undefined" && lastPath!=null && typeof lastPath=="string"){
  if (lastPath=="node-less.js"){ //called from command line
    console.log("[INFO] node-less called from command line");
   var cl=true;  
    //get the arguments and call parse
    var arguments=process.ARGV.slice(2);//slice away the first two parameters, the rest are arguments
    if (arguments.length==0){console.log("[ERROR] Please provide at least one file to parse");return;}
    arguments.forEach(function(argument){
      //do some checking her
      if (path.extname(argument)!==".less"){
        console.log("[ERROR] The filename shall end with .less by our convention");
        return;
      }
    });
    var lessParser= new NodeLess({cl:cl}).parse(arguments);
  }else{
    console.log("[INFO] node-less called as Module")
    exports.cl=false;    
  }
}
})();