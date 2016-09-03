module.exports = function(grunt) {
  var watchFiles = {
    serverTS: ['routes/*.ts', '*.ts', 'models/*.ts']
  }

  grunt.initConfig({
    watch: {
      serverTS: {
        files: watchFiles.serverTS,
        tasks: ['typescript']
      }
    },

    typescript: {
      base: {
        src: watchFiles.serverTS
      }
    },

    nodemon: {
      dev: {
        script: 'bin/www',
        options: {
          nodeArgs: ['--debug'],
          watch: watchFiles.serverTS
        }
      }
    },

    concurrent: {
      default: ['nodemon', 'watch'],
      options: {
        logConcurrentOutput: true,
        limit: 10
      }
    }


  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('default', ['concurrent:default'] );

}
