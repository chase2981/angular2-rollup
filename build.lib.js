"use strict";

require('shelljs/global');

const env         = 'prod';

const fs          = require('fs');
const utils       = require('./build.utils.js');
const chokidar    = require('chokidar');
const sass        = require('node-sass');
const postcss     = require('./postcss.'+env+'.js');
const minifyHtml  = require('html-minifier').minify;

if (utils.paths.preLibraryBuild) {
  const preBuild = utils.paths.preLibraryBuild;
}

if (utils.paths.postLibraryBuild) {
  const postBuild = utils.paths.postLibraryBuild;
}

const console   = utils.console;
const colors    = utils.colors;
const scripts   = utils.scripts;
const paths     = utils.paths;
const log       = utils.log;
const alert     = utils.alert;
const warn      = utils.warn;
const clean     = utils.clean;
const angular   = utils.angular;


let canWatch = false;
let isCompiling = false;
let hasInit = false;
let styleFiles = [];
let hasCompletedFirstStylePass = false;
let postcssConfig = ' -u';


/* Test for arguments the ngr cli spits out */

process.argv.forEach((arg)=>{
  if (arg.includes('watch')) {
    canWatch = arg.split('=')[1].trim() === 'true' ? true : false;
  }
});

/* Process PostCSS CLI plugins for the --use argument */

for (let cssProp in postcss.plugins) {
  postcssConfig += ' '+cssProp;
}


/*

  Copy Tasks

- file: Copies a file to /dist

*/

const copy = {
    file: (path) => {
        cp('-R', path, paths.dist+'/');
        log(path, 'copied to', paths.dist+'/');
    }
};


/*

  Compile Tasks

- clean: Removes source code comments
- src: Compiles library components and formats for AOT,
       using `ngc` and Rollup, according to Angular Package Format 4.0 spec
- umdLib: Formats the bundle according to the UMD module pattern in /dist/bundles/
- es5Lib: Transpiles the bundle down to ES5 in /dist

*/


const compile = {

    clean: (path) => {

      const outFile = path ? path : './'+paths.dist+'/bundle.js';
      let inline = '';

      fs.readFile(outFile, 'utf8', function(err, contents) {
        if(!err) {
            contents = contents.replace(utils.multilineComment, '');
            contents = contents.replace(utils.singleLineComment, '');

            if ( contents.search(utils.componentRegex) > -1 ) {
              inline = angular({
                preprocessors: {
                  template: template => minifyHtml(template, {
                      caseSensitive: true,
                      collapseWhitespace: true,
                      removeComments: true,
                      quoteCharacter: '"'
                  })
                }
              }, contents, path.substring(0, path.lastIndexOf('/')));

              alert('ngr', 'inline', 'template and styles for', path);

              if (inline) {
                contents = inline.code;
              }

            }

            fs.writeFile(outFile, contents, function(err){
              if(!err) {
              //  log('Cleaned up', 'comments', 'from', outFile);
              } else {
                warn(err);
              }
            });
        } else {
          warn(err);
        }

      });

    },

    src : () => {

        isCompiling = true;


        // remove moduleId prior to ngc build. TODO: look for another method.
        ls('./tmp/**/*.ts').forEach(function(file) {

          compile.clean(file);
          sed('-i', /^.*moduleId: module.id,.*$/, '', file);

        });

        let clean = exec(scripts['clean:ngfactory'], function(code, output, error) {

              alert('ngc', 'started', 'compiling', 'ngfactory');

              let tsc = exec(paths.projectRoot+'/node_modules/.bin/ngc -p ./tsconfig.lib.json', function(code, output, error) {

                  alert('ngc', 'compiled', '/ngfactory');
                  cp('-R', paths.lib+'/.', 'ngfactory/');
                  alert('Rollup', 'started bundling', 'ngfactory');

                 let bundle = exec(paths.projectRoot+'/node_modules/.bin/rollup -c '+paths.projectRoot+'/rollup.config.lib.js', function(code, output, error) {

                     alert('Rollup', 'bundled', paths.libFilename+'.js in', './'+paths.dist);
                     compile.umdLib();

                 });


              });
       });

    },

    umdLib : () => {

         let tsc = exec(paths.projectRoot+'/node_modules/.bin/ngc -p ./tsconfig.lib.es5.json', function(code, output, error) {
                  alert('ngc', 'compiled', '/ngfactory');
                  alert('Rollup', 'started bundling', 'ngfactory');

                 let bundle = exec(paths.projectRoot+'/node_modules/.bin/rollup -c '+paths.projectRoot+'/rollup.config.lib-umd.js', function(code, output, error) {

                     alert('Rollup', 'bundled', paths.libFilename+'.umd.js in', './'+paths.dist+'/bundles');

                     alert('Babel', 'started transpiling', paths.libFilename+'.umd.js');

                     let transpile = exec(paths.projectRoot + '/node_modules/.bin/babel --plugins=transform-es2015-modules-commonjs ./dist/bundles/' + paths.libFilename + '.umd.js --out-file ./dist/bundles/' + paths.libFilename +'.umd.js', function(code, output, error){
                          alert('Babel', 'transpiled', './'+paths.dist+'/bundles/'+paths.libFilename+' to', './'+paths.dist+'/bundles/'+paths.libFilename+'.umd.js');
                          compile.es5Lib();
                     });



                 });
              });
    },


    es5Lib : () => {



         let tsc = exec(paths.projectRoot+'/node_modules/.bin/ngc -p ./tsconfig.lib.es5.json', function(code, output, error) {

          log('ngc', 'compiled', '/ngfactory');
                  alert('Rollup', 'started bundling', 'ngfactory');

                 let bundle = exec(paths.projectRoot+'/node_modules/.bin/rollup -c '+paths.projectRoot+'/rollup.config.lib-es5.js', function(code, output, error) {

                    alert('Rollup', 'bundled', paths.libFilename+'.es5.js in', './'+paths.dist);

                    // loop over all files in ngfactory, remove js files, copy to dist
                    exec(require(utils.paths.projectRoot + '/package.json').scripts['copy:lib'], function() {

                      log('d.ts, metadata.json', 'copied to', './'+paths.dist);

                      rm(paths.dist + '/index.ts');

                      find('./'+paths.dist).filter(function(file) {

                        if (utils.paths.buildHooks && utils.paths.buildHooks.lib && utils.paths.buildHooks.lib.clean) {
                          utils.paths.buildHooks.lib.clean(file);
                        } else {
                          if (file.match(/component.ts$/) || file.match(/directive.ts$/) || file.match(/injectable.ts$/) || file.match(/module.ts$/) || file.match(/.html$/) || file.match(/.scss$/)) {
                            rm(file);
                          }
                        }

                      });

                    });

                    alert('Babel', 'started transpiling', paths.libFilename+'.es5.js');

                    let transpile = exec(paths.projectRoot + '/node_modules/.bin/babel --presets=es2015-rollup ./dist/' + paths.libFilename + '.es5.js --out-file ./dist/' + paths.libFilename +'.es5.js', function(code, output, error){
                          alert('Babel', 'transpiled', './'+paths.dist+'/'+paths.libFilename+' to', './'+paths.dist+'/'+paths.libFilename+'.es5.js');
                     });

                    exec( require(utils.paths.projectRoot + '/package.json').scripts['copy:package'], function() {

                      log('package.json', 'copied to', './'+paths.dist);

                      if (utils.paths.buildHooks && utils.paths.buildHooks.lib && utils.paths.buildHooks.lib.post) {
                        utils.paths.buildHooks.lib.post();
                      }

                    });

                 });
              });
    }
};

/*

  Style Tasks

  - file: Styles a single file.
         - If the file is in the /src/styles folder it will compile /src/styles/style.scss
         - If the file is elsewhere, like part of a Component, it will compile into the
          appropriate folder in the /tmp directory, then ngc will run and compile for AOT
  - src: Compiles the global styles

  SASS render method is called and fs writes the files to appropriate folder
  PostCSS processes the file in place, using the --replace argument


*/


let style = {

    file: (path, watch) => {


        let srcPath = path.substring(0, path.lastIndexOf("/"));
        let globalCSSFilename = paths.globalCSSFilename !== undefined ? paths.globalCSSFilename : 'style.css';
        let filename = path.replace(/^.*[\\\/]/, '');
        let outFile = path.indexOf(paths.src+'/style') > -1 ? paths.dist+'/style/'+globalCSSFilename  : path.replace('.scss','.css').replace(paths.src, 'tmp').replace(paths.lib.replace('src/', ''), '');

        sass.render({
          file: path.indexOf(paths.src+'/style') > -1 ? 'src/style/style.scss' : path,
          outFile: outFile,
          includePaths: [ paths.src+'/style/' ],
          outputStyle: 'expanded',
          sourceComments: false
        }, function(error, result) {
          if (error) {
            warn(error.status);
            warn(error.column);
            warn(error.message);
            warn(error.line);
          } else {

            fs.writeFile(outFile, result.css, function(err){

              let postcss = exec(paths.projectRoot+'/node_modules/.bin/postcss ./'+outFile+' -c '+paths.projectRoot+'/postcss.'+env+'.js -r'+postcssConfig, function(code, output, error) {
                   if( !watch ) {

                      if( hasCompletedFirstStylePass === true || styleFiles.indexOf(path) === styleFiles.length - 1) {

                        alert('libsass and postcss', 'compiled');
                        hasCompletedFirstStylePass === true;
                        compile.src();

                      }

                    }
                });

            });

          }
        });

    },
    src:() =>{

        mkdir(paths.dist+'/style');

        style.file(paths.src+'/style/style.scss');

        if (ls('./' + paths.lib + '/**/*.scss').length > 0) {

          ls('./' + paths.lib + '/**/*.scss').forEach(function (file, index) {

            if (file.replace(/^.*[\\\/]/, '')[0] !== '_') {
              styleFiles.push(file);
            }

          });

          ls('./' + paths.lib + '/**/*.scss').forEach(function (file, index) {

            if (file.replace(/^.*[\\\/]/, '')[0] !== '_') {
              style.file(file);
            }

          });

        }


    }
};

/*

  Init Tasks

  A sequence of commands needed to clean and start the lib build

*/


let init = function() {

    rm('-rf', paths.projectRoot+'/.tmp/');
    rm('-rf', './ngfactory');
    rm('-rf', './'+paths.dist);

    mkdir('./ngfactory');
    mkdir('./'+paths.dist);
    mkdir('./'+paths.dist+'/bundles');

    if (utils.paths.buildHooks && utils.paths.buildHooks.lib &&  utils.paths.buildHooks.lib.pre) {
      utils.paths.buildHooks.lib.pre();
    }

    clean.lib();
    style.src();

};

/*

  Watcher

  Chokidar is used to watch files, run the above methods.

*/


let watcher = chokidar.watch('./'+paths.src+'/**/*.*', {
  ignored: /[\/\\]\./,
  persistent: canWatch
}).on('change', path => {

      if ( path.indexOf(paths.src+'/public') > -1 ) {

          if ( path.indexOf(paths.src+'/index.html') ) {
            copy.public();
          } else {
            copy.file(path);
          }

      }

      else if ( path.indexOf('.html') > -1 && path.indexOf('src') > -1) {

        alert('CHANGE DETECTED', path, 'triggered', 'transpile');

        if(!isCompiling) {
          clean.lib();
          compile.src();
        }

      }

      else if ( path.indexOf('.ts') > -1 && hasInit === true) {

        alert('CHANGE DETECTED', path, 'triggered', 'transpile');

        utils.tslint(path);

        if (!isCompiling) {
              clean.lib();
              compile.src();
        }

      }

      else if ( path.indexOf('.scss') > -1 ) {

        alert('CHANGE DETECTED', path, 'triggered', 'sass and postcss');
        clean.lib();
        style.file(path, true);

      }

   })
  .on('unlink', path => log('File', path, 'has been', 'removed'));

watcher
  .on('error', error =>  warn('ERROR:', error))
  .on('ready', () => {

    alert('INITIAL SCAN COMPLETE', 'building for', env);

    init();
});
