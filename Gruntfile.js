/* jshint node: true */
module.exports = function(grunt){
    "use strict";
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        sshconfig: grunt.file.readJSON("server-config.json"),

        watch: {
            dist: {
                files: ["_site/**"],
                options: { livereload: true }
            }
        },

        sftp: {
            siteBuild: {
                options: {
                    srcBasePath: "_site/",
                    showProgress: true,
                    createDirectories: true,
                },
                files: {
                    "./": "_site/**",
                }
            }
        },

        sshexec: {
            clean: {
                command: "cd <%= deploymentPath %>; rm -rf ./*;",
                options: {}
            }
        },

        notify: {
            deploy: {
                options: {
                    message: "Deployment completed successfully to the <%= deploymentServer %> server."
                }
            }

        },

        deployFeedback: {
            dist: {
                callback: function() {
                    grunt.log.writeln(">> ===================================================".green.bold);
                    var msg = grunt.config.process("<%= deploymentServer %>");
                    msg = ">> Files uploaded successfully to the " + msg + " server.";
                    grunt.log.writeln(msg.green.bold);
                    grunt.log.writeln(">> ===================================================".green.bold);
                }
            }
        }

    });

    var deployFeedbackTaskDescription = "internal task to display feedback to the user when deployment is completed";
    grunt.registerMultiTask("deployFeedback", deployFeedbackTaskDescription, function() {
        this.data.callback.call();
    });
    grunt.registerTask("deploy", "Deploy project files to a specified remote server", function(){
        var targetDeployed = false;
        var availabelServers = grunt.config.get("sshconfig");
        var currentServer = false;
        for(var server in availabelServers) {
            if(availabelServers.hasOwnProperty(server)){
                if(targetDeployed){ break; }
                if(!!grunt.option(server)){
                    var preIntroNotifyText = ">> running deployment for the ".cyan.bold;
                    preIntroNotifyText += server.magenta.bold + " server ".cyan.bold;
                    grunt.log.writeln(preIntroNotifyText);
                    currentServer = server;
                    grunt.config.set("sftp.themeFiles.options.config", currentServer);
                    grunt.config.set("sshexec.clean.options.config", currentServer);
                    grunt.config.set("deploymentServer", currentServer.toUpperCase());
                    grunt.config.set("deploymentPath", availabelServers[currentServer].path);
                    grunt.task.run(["sshexec:clean", "sftp", "notify:deploy", "deployFeedback"]);
                    targetDeployed = true;
                }
            }
        }
        if(!targetDeployed){
            grunt.log.writeln(">> No target remote server specified".red.bold);
            grunt.log.writeln(">> Make sure you provide the correct server details within server-config.json".red.bold);
            grunt.log.writeln(">> and trigger deployment using the server name flag like".red.bold);
            grunt.log.writeln(">> grunt deploy --serverName".red.bold);
        }
    });

    require("load-grunt-tasks")(grunt);

    grunt.registerTask("default", ["watch"]);

};
