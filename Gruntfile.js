// TODO:
//  * add in grunt tasks to create custom project

module.exports = function(grunt) {

    // Add the grunt-mocha-test tasks.
    require('load-grunt-tasks')(grunt);

    var BUILD_DIR   = './dist';
    var RELEASE_DIR = './dist';

    grunt.initConfig({

        pkg : grunt.file.readJSON( 'package.json' ),

        // Configure a mochaTest task
        mochaTest: {
            smoke: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/helpers.js']
            }
        },
        //Build Release Tasks
        mkdir: {
            all: {
                options: { create: [BUILD_DIR] }
            }
        },
        clean: {
            build: {
                src: [ BUILD_DIR ]
            }
        },
        copy: {
            build: {
                files: [
                    { src: [ './bin/**'     ], dest: BUILD_DIR, expand: true },
                    { src: [ './lib/**'     ], dest: BUILD_DIR, expand: true },
                    { src: [ './bin/**'     ], dest: BUILD_DIR, expand: true },
                    { src: [ 'package.json' ], dest: BUILD_DIR, expand: true },
                    { src: [ 'README.md' ], dest: BUILD_DIR, expand: true },
                    { src: [ 'LICENSE' ], dest: BUILD_DIR, expand: true },
                    { src: [ 'release-notes.txt' ], dest: BUILD_DIR, expand: true }
                ]
            },
            coverage: {
                src: ['test/**'],
                dest: 'coverage/'
            }
        },
        jshint: {
            files : ['lib/**/*.js', '!lib/management/assets/**/*.js', 'bin/**/*.js'],
            options: {
                curly    : true,
                eqeqeq   : false,
                eqnull   : false,
                laxcomma : true,
                lastsemic: true,
                sub      : true,
                node     : true
            }
        },
        uglify: {
            build: {
                files: [{
                    expand: true,
                    mangle: false,
                    cwd   : './lib',
                    src   : '**/*.js',
                    dest  : RELEASE_DIR + '/lib'
                }]
            }
        },
        exec: {
            lsr        : { cmd: 'ls -la', cwd: 'release' }
            , npm_release: { cmd: 'npm install --production', cwd: 'release' }
            , more_pkg   : { cmd: 'more package.json', cwd: 'release' }
            , prune_pkg  : { cmd: function(){
                var rPkg = grunt.file.readJSON( 'package.json' )
                delete rPkg.devDependencies;
                delete rPkg.scripts;
                grunt.file.write(BUILD_DIR + '/package.json', JSON.stringify(rPkg, null, 4));
                return "";
            }}
        },
        changelog: {
            options: {
                commitLink: function(commitHash){ return "https://bitbucket.org/redbookplatform/rbc-agent" + '/commits/' + commitHash; }
                , from: "de45ea5124f8f4e060bfcea7ccc0877fb5fcbcd3"
            }
        },
        publish: {
            main: {
                src: [
                    'dist'
                ]
            },
            regex: {
                src: ['test/**/*', 'node_modules']
            }
        },

        //Bump the version number
        bump: {
            options: {
                files: ['package.json'],
                updateConfigs: [],
                commit: true,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['package.json'],
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: true,
                pushTo: 'origin',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
            }
        },
        mocha_istanbul: {
            coverage: {
                src: ['test/**/*.spec.js'],
                options: {
                    coverageFolder: 'tests/coverage'
                }
            }
        }
    });

    grunt.registerTask('testWithCoverage',
        'test and generate coverage reports',
        ['mocha_istanbul']
    );

    grunt.registerTask('test',
        'basic check of the codebase',
        ['mochaTest:smoke']
    );

    //Build a Basic Distribution
    grunt.registerTask('package',
        'Compiles all of the assets and copies the files to the build directory.',
        [ 'clean', 'mkdir', 'copy', 'exec:prune_pkg']
    );

    grunt.registerTask('release',
        'Creates a release',
        [ 'changelog', 'clean', 'mkdir', 'bump', 'copy', 'exec:prune_pkg']
    );

};
