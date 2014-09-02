/**
 * Carpets Plus Gruntfile
 * output dynamic
 */

module.exports = function(grunt) {

  // use matchdep to load our grunt-related npm modules dynamically from package.json (including our dev only modules)
  require('matchdep').filterAll('grunt-*', require("./package.json")).forEach( grunt.loadNpmTasks );

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    clean: {
        options:{
            // "no-write": true // use this for testing new paths (prevents deletion / tests targets).
        },
        files: [
            'dist/',
        ]
    },

    compress: {

      prod: {

        options: {
          archive: 'archives/carpets_plus_<%= pkg.version %>.zip',
          pretty: true
        },

        files: [{
          src: ['dist/**'],
          dest: './', // use top level folder internally (vs expanding to 'dist')

        }]
      }

    },

    copy: {
      img: {
        files: [{
            expand: true,
            src: ['images/**'],
            dest: 'dist/'
        }],
      },

      cssExtra: {
        files: [{
            expand: true,
            src: ['css/font/**', 'css/images/**','css/ie/**'],
            dest: 'dist'
        }],
      }
    },

    cssmin: {
        main: {
            options: {
                banner: "/* Overflow 1.1 by HTML5 UP | html5up.net | @n33co | Free for personal and commercial use under the CCA 3.0 license (html5up.net/license) */"
            },

            files: [{
                expand: true,
                cwd: 'css/',
                src: ['*.css', '!*.min.css'],
                dest: 'dist/css/',
                ext: '.css'
            }]

        }
    },



    /**
     * minify / compress the HTML
     */
    htmlmin: {
      dist: {

        options: {
          collapseWhitespace: true,
          removeComments: true,
          removeScriptTypeAttributes: true,
          useShortDoctype: true,
        },

        files: {
            // Dictionary of files ('destination': 'source')
            'dist/index.html': 'index.html'
        }
      }
    },

    /**
     * replace image URIs in CSS with base64 encoded equivelent data-uri
     * https://github.com/ehynds/grunt-image-embed
     */
    imageEmbed: {
        dist: {
            files: [{
              expand: true,
              src: [ "css/**/*.css" ],
              dest: [ "dist/css/" ],
            }]
        },
        options: {
            deleteAfterEncoding : false
          }
      },

    uglify: {
        prod: {
          // options: {
          //   mangle: false,
          // },
          files: [{
              expand: true,
              cwd: 'js',
              src: '**/*.js',
              dest: 'dist/js'
          }]
        }
    }

  });

    grunt.registerTask('default', 'minify');
    grunt.registerTask('minify', ['copy', 'htmlmin', 'cssmin', 'uglify']);
    grunt.registerTask('stage', ['minify', 'compress']);


};
