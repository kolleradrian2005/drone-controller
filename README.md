# Drone backend

Node.js communicates with the Navio2 flight controller through c++. Running c++ codes from javascript was possible by using __node-addon-api__ NPM package:

``` powershell
npm install -g node-addon-api
```

## __Source__

__https://medium.com/jspoint/a-simple-guide-to-load-c-c-code-into-node-js-javascript-applications-3fcccf54fd32__

## Create __binding.gyp__ file
Then, a python script was needed in order to share code between the programming languages:
```gyp
{
  "targets": [
    {
      "target_name": "NAME",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [
        "./src/EXAMPLE.cpp",
        "./src/index.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
    }
  ]
}
```
Note: Every file _included_ in any cpp code is ought to be signed in _"sources"_
 otherwise it won't work.

## Install node-gyp
This module will basically help to convert __.cpp__ to __.node__.
``` powershell
npm install -g node-gyp
```

## Run these commands in order to compile c++

``` powershell
# Either use these two commands
node-gyp configure
node-gyp build
# Or simply use
npm install
```
##### It will create a _build_ directory that contains the node module. If the directory already exists, it overrides it.

## Node.js
```js
// Import module 
const greetModule = require('./build/Release/greet.node')
// Test it
console.log('greetModule.greetHello() : ', greetModule.greetHello());
```
Dont forget to stop APM!
``` powershell
sudo emlidtool ardupilot
```

## One line dir search
This code can be used in _binding.gyp_. It adds every __.cpp__ file in the _"sources"_ section. 
``` js
// This code is used in binding.gyp to crawl through directories

var fs=require('fs'),
path=require('path'),
walk=function(r)
{
    let t,e=[],
    n=null;
    try
    {
        t=fs.readdirSync(r)
    }
    catch(r)
    {
        n=r.toString()
    }
    if(n)
        return n;
    var a=0;
    return function n()
    {
        var i=t[a++];
        if(!i)
            return e;
        let u=path.resolve(r,i);i=r+'/'+i;
        let c=fs.statSync(u);
        if(c&&c.isDirectory()) {
            let r=walk(i);
            return e=e.concat(r), n()
        }
        return i.includes(".cpp") ?  e.push(i) : e, n()
    }()
};
walk('./src').join(' ')
```
One line version used in _binding.gyp_:
``` py
...,
"sources": [
    "<!@(node -p \"var fs=require('fs'),path=require('path'),walk=function(r){let t,e=[],n=null;try{t=fs.readdirSync(r)}catch(r){n=r.toString()}if(n)return n;var a=0;return function n(){var i=t[a++];if(!i)return e;let u=path.resolve(r,i);i=r+'/'+i;let c=fs.statSync(u);if(c&&c.isDirectory()){let r=walk(i);return e=e.concat(r),n()}return i.includes('.cpp') ?  e.push(i) : e, n()}()};walk('./src').join(' ');\")"
],
...
```

## Replace every absolute include to relative

_Example:_ <br />
At __./src/Navio/Navio+/MB85RC256.h__: <br />

>replace
>``` cpp
>#include "<Common/I2Cdev.h>"
>```
>with
>``` cpp
>#include "../Common/I2Cdev.h"
>```

# Controller program
 - IMU
 - PI(D)