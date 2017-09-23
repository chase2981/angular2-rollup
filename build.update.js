"use strict";

require('shelljs/global');

const fs = require('fs');
const path = require('path');
const colors = require('colors');
const clim = require('clim');
const cons = clim();

let lib = false;
let useVersion = '5.0.0';

const log = function (action, noun, next) {
    let a = action ? colors.dim(colors.white(action)) : '';
    let n = noun ? colors.dim(colors.blue(noun)) : '';
    let x = next ? colors.dim(colors.white(next)) : '';
    cons.log(a + ' ' + n + ' ' + x);
};

const alert = function (noun, verb, action, next) {
    let n = noun ? colors.bold(noun) : '';
    let v = verb ? colors.blue(verb) : '';
    let a = action ? colors.cyan(action) : '';
    let x = next ? colors.dim(colors.white(next)) : '';
    cons.log(n + ' ' + v + ' ' + a + ' ' + x);
};


clim.getTime = function () {
    let now = new Date();
    return colors.gray(colors.dim('[' +
        (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' +
        (now.getMinutes() < 10 ? '0' : '') + now.getMinutes() + ':' +
        (now.getSeconds() < 10 ? '0' : '') + now.getSeconds() + ']'));
};

clim.logWrite = function (level, prefixes, msg) {
    // Default implementation writing to stderr
    var line = clim.getTime() + " " + level;
    if (prefixes.length > 0) line += " " + prefixes.join(" ");

    line = colors.dim(line);
    line += " " + msg;
    process.stderr.write(line + "\n");

    // or post it web service, save to database etc...
};


const files = [
    'src',
    '.editorconfig',
    '.gitignore',
    '.npmignore',
    'build.config.js',
    'closure.conf',
    'closure.lazy.conf',
    'closure.externs.js',
    'karma-test-shim.js',
    'karma.conf.js',
    'main.prod.js',
    'main.prod.ts',
    'main.ts',
    'postcss.dev.js',
    'postcss.jit.js',
    'postcss.prod.js',
    'protractor.config.js',
    'rollup.config.js',
    'rollup.config.lib.js',
    'rollup.config.lib-es5.js',
    'rollup.config.lib-umd.js',
    'router.js',
    'server.config.dev.js',
    'server.config.prod.js',
    'server.js',
    'tsconfig.dev.json',
    'tsconfig.jit.json',
    'tsconfig.prod.json',
    'tsconfig.prod.lazy.json',
    'tsconfig.lib.json',
    'tsconfig.lib.es5.json',
    'jsconfig.json',
    'tslint.json'
];



/* Test for arguments the ngr cli spits out */

process.argv.forEach((arg) => {
    if (arg.includes('version')) {
        useVersion = arg.toString().split('=')[1];
    }
});


let init = function () {


    fs.readFile(path.dirname(process.cwd()) + '/' + path.basename(process.cwd()) + '/package.json', (err, script) => {

        if (err) throw err;

        script = JSON.parse(script);

        Object.keys(script.dependencies).forEach((dep) => {
            if (dep.includes('@angular')) {
                script.dependencies[dep] = useVersion;
            }
        });

        Object.keys(script.devDependencies).forEach((dep) => {
            if (dep.includes('@angular')) {
                script.devDependencies[dep] = useVersion;
            }
        });

        fs.writeFile(path.dirname(process.cwd()) + '/' + path.basename(process.cwd()) + '/package.json', JSON.stringify(script, null, 4), function (err) {
            if (err) log(err);
            alert('ngr updated ' + colors.bold(colors.red('@angular')), '=> ' + colors.bold(colors.white(useVersion)) );
        });

    });


};


init();