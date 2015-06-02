#!/usr/bin/env node

var program = require('commander');
var Parser  = require('bodhi-dbf')().Parser;
var fs      = require('fs');
var path    = require('path');
var pkg     = require('../package.json');

function strEndsWith(str, suffix) {
    return str.match(suffix+"$")==suffix;
}

function getFile(file){
    if(strEndsWith(file.toLowerCase(), 'dbf')){
        return path.resolve(process.cwd(), file);
    } else {
        return path.resolve(process.cwd(), file + '.dbf');
    }
}

function getName(file){
    return path.parse(file).name;
}

function mapType(header){

    var type = 'String';

    switch (header.type){
        case 'C':
            type = 'String';
            break;
        case 'N':
        case 'F':
            type = (header.decimalPlaces > 0) ? 'Real' : 'Integer';
            break;
        case 'D':
            type = 'DateTime';
            break;
        case 'L':
            type = 'Boolean';
            break;
        default:
            break;
    }

    return type;
}

function shouldRequire(header){
    var required = false;
    switch (header.name){
        case 'ID':
        case 'NAME':
            required = true;
            break;
        default:
            break;
    }
    return required;
}

program
    .version(pkg.version)

program
    .command('header [path]')
    .description('list the fields in ta dbf file')
    .option("-d, --working-dir [mode]", "The base directory")
    .action(function(path, options){
        if(options.workingDir){
            process.chdir(options.workingDir)
        }
        var parser = new Parser(getFile(path))
        parser.on('header', function(h) {
            console.log(h);
        });
        parser.parse();
    });

program
    .command('field [path] [key]')
    .description('show the details of a field')
    .option("-d, --working-dir [mode]", "The base directory")
    .action(function(path, key, options){
        if(options.workingDir){
            process.chdir(options.workingDir)
        }

        var parser = new Parser(getFile(path))
        parser.on('header', function(h) {
            h.fields.forEach(function(field){
                if(field.name.toLowerCase() === key.toLowerCase()){
                    console.log(field);
                }
            })
        });
        parser.parse();
    });

program
    .command('fields [path]')
    .description('list the fields in a dbf file')
    .option("-d, --working-dir [mode]", "The base directory")
    .action(function(path, options){
        if(options.workingDir){
            process.chdir(options.workingDir)
        }
        var parser = new Parser(getFile(path))
        parser.on('header', function(h) {
            //console.log(h.fields);
            h.fields.forEach(function(field){
                console.log('%s\t\t%s', field.name, mapType(field) );
            })

        });
        parser.parse();
    });

program
    .command('model [path]')
    .description('model the dbf as a type')
    .option("-n, --name [name]", "The base directory")
    .option("-e, --embeddded"  , "The base directory")
    .option("--hash"           , "include an identity hash with the model")
    .option("-d, --working-dir [path]", "The base directory")
    .action(function(path, options){

        if(options.workingDir){
            process.chdir(options.workingDir)
        }

        var parser = new Parser(getFile(path))
        parser.on('header', function(h) {
            var type = {};
            type.name = options.name || getName(path);
            type.embedded = (options.embedded) ? true : false;
            type.properties = {};

            h.fields.forEach(function (field) {
                var $ = type.properties[field.name] = {};
                $.type =  mapType(field);
                if(shouldRequire(field)){
                    $.required = true;
                }
            });

            if(options.hash){
                type.properties.hash = {
                    type: 'String',
                    required: true
                }
            }

            console.log(JSON.stringify(type, null, '  '));
        });
        parser.parse();
    });

program
    .command('map [path]')
    .description('model the dbf as a type')
    .option("-n, --name [name]", "The base directory")
    .option("-e, --embeddded"  , "The base directory")
    .option("-d, --working-dir [path]", "The base directory")
    .action(function(path, options){

        if(options.workingDir){
            process.chdir(options.workingDir)
        }

        var parser = new Parser(getFile(path))
        parser.on('header', function(h) {
            var type = {};

            h.fields.forEach(function (field) {
                type[field.name.toLowerCase()] = field.name;
            });

            console.log(JSON.stringify(type, null, '  '));
        });
        parser.parse();
    });


program
    .command('count [path]')
    .description('list the fields in ta dbf file')
    .option("-d, --working-dir [mode]", "The base directory")
    .action(function(path, options){
        if(options.workingDir){
            process.chdir(options.workingDir)
        }

        var parser = new Parser(getFile(path))
        parser.on('header', function(h) {
            console.log(h.numberOfRecords);
        });
        parser.parse();
    });


program
    .command('sample [path]')
    .description('list the fields in ta dbf file')
    .option("-d, --working-dir [mode]", "The base directory")
    .action(function(path, options){
        if(options.workingDir){
            process.chdir(options.workingDir)
        }

        var parser = new Parser(getFile(path))
        var col = [];
        parser.on('record', function(r) {
            col.push(r);
        });
        parser.on('end', function(r) {
            setTimeout(function(){
                console.log(col[0]);
            }, 500);
        });

        parser.parse();
    });

program
    .command('export [path]')
    .description('list the fields as a JSON file')
    .option("-d, --working-dir [mode]", "The base directory")
    .action(function(path, options){
        if(options.workingDir){
            process.chdir(options.workingDir)
        }

        var parser = new Parser(getFile(path))
        var col = [];
        parser.on('record', function(r) {
            col.push(r);
        });
        parser.on('end', function(r) {
            setTimeout(function(){
                console.log(col);
            }, 500);
        });

        parser.parse();
    });

program
    .command('measure [path]')
    .description('measure the parse of a dbf file')
    .option("-d, --working-dir [mode]", "The base directory")
    .action(function(path, options){
        if(options.workingDir){
            process.chdir(options.workingDir)
        }

        var parser = new Parser(getFile(path));

        var count     = 0;
        var fields    = 0;
        var length    = 0;
        var startTime;
        var col = [];

        parser.on('start', function(p) {
            console.log('Unpacking the file');
            startTime = new Date().getTime();
        });

        parser.on('header', function(h) {
            count  = h.numberOfRecords;
            fields = h.fields.length;
            length = h.recordLength;
        });

        parser.on('end', function(p) {
            console.log('Finished parsing the file w/ %d records', count);
            console.log('Fields %d', fields);
            console.log('Length %d', length);
            var endTime = new Date().getTime();
            console.log("The processing took: " + (endTime - startTime) + "ms.");
        });

        parser.parse();
    });

program.parse(process.argv);
