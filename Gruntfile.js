/**
 * Carpets Plus Gruntfile
 * output dynamic 
 */
 
module.exports = function(grunt) {
  
  var outputPath = 'validation/<%= grunt.template.today("yyyy-mm-dd") %>/',
    licenseeData = require('./licensee.json').clubs;
  
  // use matchdep to load our grunt-related npm modules dynamically from package.json (including our dev only modules)
  require('matchdep').filterAll('grunt-*', require("./package.json")).forEach( grunt.loadNpmTasks );


  // load "external" custom tasks (not npm tasks; these are 'our' tasks)
  grunt.loadTasks( __dirname + '/grunttasks/');

  
  grunt.initConfig({
    
    pkg: grunt.file.readJSON('package.json'),

    lessFiles: [{
      expand: true,
      cwd: 'less/',
      src: ['**/!(_)*.less', '!includes/**.less'],
      dest: 'dist/css/',
      ext: '.css'
    }],

    /**
     * this uses https://github.com/MathiasPaumgarten/grunt-bake to implement modifications to themes by loading and replacing Handlebars-style placeholders
     *    with data from the JSON files in data/
     * this configuration is currently generated at runtime by the bakeClubContent custom task defined in grunttasks.  
     */
    bake: {},

    /**
     * stub to pass data from this file to the custom task 
     */
    bakeClubContent: {
      options: {
        licensees: licenseeData,
        azHeaderPath: 'templates/arz/header.html',
        azFooterPath: 'templates/arz/footer.html',
        azTrackingPath: 'templates/arz/tracking.html'
      }
    },

    clean: {
      options:{
        // "no-write": true // use this for testing new paths.  prevents deletion.
      },
      files: [
        'dist/',
        'temp/',
        'archives/',
        'resources',
        'components'
        // TODO: delete validation reports older than 30 days?
      ]
    },

    compress: {
      
      prod: {
        
        options: {
          archive: 'archives/licensee_content_<%= grunt.template.today("yyyy-mm-dd") %>.zip',
          pretty: true
        },

        files: [{
          src: ['resources/**']
        }]
      }

    },
    
    copy: {

      deploy: {
        files: [
          {
            expand: true,
            cwd: 'dist/html-min',
            src: ['**/*.html'],
            dest: 'resources'
          },
          {
            expand: true,
            cwd: 'dist/css',
            src: ['**/*.css'],
            dest: 'resources'
          },
          {
            expand: true,
            cwd: 'dist/js',
            src: ['**/*.js'],
            dest: 'resources'
          },
          // FIXME: DRY this out (see img target below)
          {
            expand: true,
            cwd: 'assets/',
            // TODO: experiment with getting a regX pattern like (png|gif|jpg|jpeg|bmp|tiff|svg) working?
            src: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.js', '**/*.css'],
            dest: 'resources'
          }
        ]
      },

      // TODO: see if we can come up with a better solution for this (aka is there a better place to include this where we don't have to copy it?)
      img: {
        files: [{
          expand: true,
          cwd: 'assets/',
          // TODO: experiment with getting a regX pattern like (png|gif|jpg|jpeg|bmp|tiff|svg) working?
          src: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.js', '**/*.css'],
          dest: 'dist/resources'
        }]
      },

      jsdev: {
        files: [{
          expand: true,
          cwd: 'js/',
          src: ['**/*.js'],
          dest: 'dist/js'
        }]
      },

      assets: {
        files: [{
          expand: true,
          cwd: 'assets/',
          src: ['**/*'],
          dest: 'dist/resources'
        },
        {
          src: ['components/bootstrap/docs/assets/css/bootstrap.css'],
          dest: 'dist/css/bootstrap.css'
        },
        {
          src: ['components/bootstrap/docs/assets/css/bootstrap-responsive.css'],
          dest: 'dist/css/bootstrap-responsive.css'
        },
        {
          src: ['components/bootstrap/docs/assets/js/jquery.js'],
          dest: 'dist/js/jquery.js'
        },
        {
          src: ['components/handlebars/handlebars.js'],
          dest: 'dist/js/handlebars.js'
        }]
      }
    },

    /**
     * stub to pass data from this file to the custom task 
     */
    genhtmlconfig : {
      options: {
        licensees: licenseeData
      }
    },

    /**
     * this uses https://github.com/spatools/grunt-html-build to build html templates for testing locally (absent any TST styles / DOM)
     * this configuration is built at runtime by the genhtmlconfig custom task defined in grunttasks
     */
    htmlbuild: {},

    /**
     * minify / compress the HTML so our end-user clients don't have to be punished with Giant downloads.
     * Taylor - this one is just for you. 
     */
    htmlmin: {
      dist: {
        options: {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: false,
          useShortDoctype: true,
        },
        files:[{
          expand: true,
          cwd: 'temp',
          src: ['*/**.html'],
          dest: 'dist/html-min/',
          ext: '.html'
        },
        // now get the login HB templates, without preprocessing them :)
        {
          expand: true, 
          cwd: 'templates',
          src: ['**/authedTemplate.html', '**/guestTemplate.html'],
          dest: 'dist/html-min'
        }]
      }
    },

    /**
     * replace image URIs in CSS with base64 encoded equivelent data-uri
     * PRESENTLY DISABLED - use replace to rewrite uris until we optimize this step, and use one giant CSS file per licensee in prod.
     * https://github.com/ehynds/grunt-image-embed
     */
    imageEmbed: {
        dist: {
            files: [{
              expand: true,
              src: [ "dist/css/**/*.css" ]
            }]
        },
        options: {
            deleteAfterEncoding : false
          }
      },


    less: {
      options: {
        ieCompat: true
      },
          
      dev: {
        files: '<%= lessFiles %>',

        options: {
          sourceMap: true
        }
      },

      dist: { 
        files: '<%= lessFiles %>',
        
        options: {
          cleancss: true,
          report: 'min'
        }
      }
    },

    lesslint: {
      src: ['less/**/*.less'],
      options: {
        csslint: {
          'ids': false,
          'adjoining-classes': false
        },
        formatters: [{
          id: 'text',
          dest: outputPath + '/lesslint.txt'
          },
          {
            id: 'checkstyle-xml',
          dest: outputPath + '/checkstyle.xml'
          }]
      }
    },

    /**
     * this target allows us to bump the version in package.json and push to the default repo, as well as create a new tag on the repo
     * https://github.com/geddski/grunt-release
     */
    release: {
      options: {
        npm: false, // we don't use NPM for this, nor is the publically accessable.
        folder: '', //default project root for NPM; clear it
        commitMessage: 'Grunt Packaged Release of TST Licensee Content Version: <%= version %>'
      }
    },

    /**
     * replace the local files URIs to resources so we can test graphics / js locally without need for other modification
     * https://github.com/outaTiME/grunt-replace
     */
    replace: {
      
      local_html: {
        options: {
           patterns: [{
            // match on opening quotes, so we can still hotlink to resources in prod (NIA looking at you) (TODO: should we or ' quotes?)
                  match: /"\/(resources)\//g,
                  replacement: '"$1/'
              }],
          excludePrefix: true // turn off @@ mathcing; we're not utilizing that.
        },
        files: [{
          expand: true, 
          src: ['dist/*.html'], // only top level (licensee test pages); we DO NOT want the minified HTML modified.
          dest: './'
        }]
      },

      // in order for imageEmbed to work properly, we must point the CSS to files on the filesystem.
      local_css: {
        options: {
           patterns: [{
                  match: /\/(resources)\//g,
                  replacement: '../../$1/'
              }],
              force: true,
          excludePrefix: true // turn off @@ mathcing; we're not utilizing that as the LESS parser would probably explode...
        },
        files: [{
          expand: true, 
          src: ['dist/css/**/*.css'],
          dest: './'
        }]
      }
    },


    uglify: {

      dist: {
        options: {
          preserveComments: 'some',
          report: 'min'
        },
        
        files: [{
          expand: true,
            cwd: 'js',
            src: ['**/*.js'],
            dest: 'dist/js/',
            ext: '.min.js'
        }]
      }

    },
    
    /**
     * validates HTML 
     */
    validation : {
      
      options: {
        path: outputPath + 'validation-status.json',
        reportpath: outputPath + 'validation-report.json'
      },
      
      files: {
        src: [ 'dist/**.html']
      }
    },

    watch: {

      assets: {
        files: ['assets/**'],
        tasks: ['copy:assets']
      },

      html: {
        files: ['templates/build_template.html', "templates/**"],
        tasks: ['licenseeHtml', 'validation']
      },
      
      less: {
        files: ['less/**/*.less'],
        tasks: ['localCss']
      },

      scripts: {
        files: ['js/**/*.js'],
        tasks: ['copy:jsdev'] 
      }
    }
    
  });
  
  grunt.registerTask('default', ['less:dist', 'uglify:dist', 'copy:img', 'licenseeHtml',  'htmlmin']);
  grunt.registerTask('dev', ['localCss', 'copy:jsdev', 'copy:img', 'copy:assets', 'licenseeHtml']);
  grunt.registerTask('validate', ['validation', 'lesslint']);
  
  grunt.registerTask('licenseeHtml', ['bakeClubContent', 'bake', 'genhtmlconfig', 'htmlbuild', 'replace:local_html']);
  grunt.registerTask('localCss', ['less:dev', 'replace:local_css']); // FUTURE: 'imageEmbed' - no need at the moment. 
  
  grunt.registerTask('prep', ['copy:deploy', 'compress:prod']);
  grunt.registerTask('stage', ['default', 'validate', 'prep']);
  grunt.registerTask('deploy', ['prep', 'release']);
  
};