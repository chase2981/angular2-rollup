##4.3.6

- Updated to Angular 4.3.6
- Fixed issue in library build that prevented global CSS form compiling minified


##4.3.5

- Updated to Angular 4.3.5
- Deprecated `@types/core-js` and instead configured `compilerOptions.lib` for the dev build


##4.3.0

- Updated to Angular 4.3.0
- Updated RxJs to ~5.4.2 and TypeScript to ^4.2.0, included TypeScript fix in RxJs
- Fixed an issue that prevented the Express Server from running without LiveReload
- Production builds now include only the specific library files production requires instead of entire library packages
- Fixed an issue copying library files with deep directory structures
- Removed system.js polyfills from index.html because they were deprecated in the package

BREAKING CHANGES


The production build now requires a new Object in build.config.js with the property name `prodLib`.

```
    dep: {
        lib: [
            'angular-srcs/shims_for_IE.js',
            'core-js',
            'reflect-metadata',
            'zone.js',
            'systemjs',
            '@angular',
            'rxjs'
        ],
        prodLib: [
            'angular-srcs/shims_for_IE.js',
            'core-js/client/shim.min.js',
            'core-js/client/shim.min.js.map',
            'systemjs/dist/system.js',
            'zone.js/dist/zone.js'
        ]
```


##4.3.0-beta.0

- Updated to Angular 4.3.0-beta.0
- Updated packages to latest compatible versions
- Commented and cleaned up build scripts
- PostCSS now defaults `autoprefixer` to `last 20 versions` for better IE support

BREAKING CHANGES

- postcss-cli config files must be migrated from pre 2.6.0 format to post 2.6.0 format

EXAMPLE:

BEFORE:

```
{
    "use": ["autoprefixer"],
    "local-plugins": true,
    "autoprefixer": {
        "browsers": "> 5%"
    }
}

```

AFTER:

```
module.exports = {
  plugins: {
    'autoprefixer': {
        browsers: '> 5%'
    }
  }
}

```

NOTE: Only the Object format is supported currently NOT the Array format. The build tools will parse the Object properties for the `--use` option.

For more information: https://github.com/postcss/postcss-cli/wiki/Migrating-from-v2-to-v3




----------------------------------------------------------------------------------------------------


##4.2.0

- Updated to Angular 4.2.0
- Fixed issue when updating global SASS, livereload and CSS would not update when editing certain files
- Fixed an issue when users move library build to another location
- Updated library build, ES5 and UMD builds are now correctly transpiled
- Updated support for external libraries, now you can specify single file instead of just folders
- Updated boilerplate to support IE9

----------------------------------------------------------------------------------------------------

##4.0.3

- Updated to Angular 4.0.3
- New CLI commands, run `npm i -g` to use in your project
- Revised README

```
  $ ngr --help

  Usage: ngr <keywords>

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -b, --build [env]      Build the application by environment
    -w, --watch [bool]     Enable file watchers to detect changes and build
    -g, --generate [type]  Generates new code from templates
    -n, --name [string]    The name of the new code to be generated (kebab-case)
    -f, --force [bool]     Force overwrite during code generate
    -d, --dir [path]       Path the code should be generated in (relative)
    -s, --spec [bool]      Include spec files in code generation
    -r, --route [bool]     Include route files in code generation
    -t, --test [bool]      Run unit tests
    --serve [bool]         Run Express Server

```

----------------------------------------------------------------------------------------------------

##4.0.2

- Updated to Angular 4.0.2

----------------------------------------------------------------------------------------------------

##4.0.1


- Updated to Angular 4.0.1
- Added more configuration to `build.config.js`, renamed from `paths.config.js`
- Added new `lib` build for distributing libraries in ES6 and ES5
- Refactored build process to default to `build` folder, `dist` is now the default for library files
- Use `npm run build:dev` instead of `npm start` for development server
- Added `npm run build:prod` for AOT production builds
- Added `npm run build:lib` for building library files
- Use `watch=true` to watch prod and lib builds, disabled by default
- Fixed watcher in dev and prod modes, will now detect css changes properly
- Fixed an issue in prod build that could cause it to fail after libsass and PostCSS
- Added documnetation for running livereload and watcher with `npm run build:prod`
- Updated README
- Created CHANGELOG


To Upgrade `build.config.js`:

1. Move the `dep` Array to `dep.lib` and `src` to `dep.src`, `dist` to `dep.dist`.

BEFORE:

```
module.exports = {
    dep: [
            'core-js',
            'reflect-metadata',
            'zone.js',
            'systemjs',
            '@angular',
            'rxjs'
        ]
    },
    src: './node_modules',
    dist: './dist/lib'
}
```

AFTER:

```
module.exports = {
    dep: {
        lib: [
            'core-js',
            'reflect-metadata',
            'zone.js',
            'systemjs',
            '@angular',
            'rxjs'
        ],
        src: './node_modules',
        dist:  './build/lib'
    }
}
```

2. Add the project `src`, `build`, and `dist` (optional) directories. These properties point to the source directory, the folder the project should be built in, and in the case of a distributing a library, the `dist` that will be used by other projects.

```
module.exports = {
    dep: {
        lib: [
            'core-js',
            'reflect-metadata',
            'zone.js',
            'systemjs',
            '@angular',
            'rxjs'
        ],
        src: './node_modules',
        dist: './build/lib'
    },
    clean:{
      files:[],
      folders:[]
    },
    src: 'src',
    build: 'build',
    dist: 'dist',
    lib: 'src/lib',
    libFilename: 'default-lib'
}


