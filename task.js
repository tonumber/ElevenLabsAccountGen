const { Listr, ListrRenderer, ListrTaskObject } = require('listr2');
var util = require('util')
let out = ""

const discord = require('discord.js')
const hook = new discord.WebhookClient({
    url: "discordhookhere"
})

// hi to remove the discord logging
// remove above, aswell as the stdout hook (line 45), and the interval/createMessage/updateMessage. im sure you can figure it out
// if you need help, dm me on discord: Fizi#0001 (or tg: t.me/stdcin)


function createMessage(content = "?") {
    return new Promise((resolve, reject) => {
        hook.send(content).then((message) => {
            resolve(message)
        })
    })
}
function updateMessage(message, content = "?") {
    return new Promise((resolve, reject) => {
        hook.editMessage(message.id, content).then((message) => {
            resolve(message)
        })
    })
}
function hook_stdout(callback) {
    var old_write = process.stdout.write

    process.stdout.write = (function (write) {
        return function (string, encoding, fd) {
            write.apply(process.stdout, arguments)
            callback(string, encoding, fd)
        }
    })(process.stdout.write)

    return function () {
        process.stdout.write = old_write
    }
}


hook_stdout(function (string, encoding, fd) {
    out = string
})


function generateTaskId() {
    return Math.random().toString(36).substr(2, 9);
}
let endedTasks = []

function runTask(tasks, discordinterval = 1000) {
    let ltasks = tasks;
    const taskId = generateTaskId()
    return new Promise((resolve, reject) => {
        createMessage("Starting...").then((message) => {

            const interval = setInterval(() => {
                updateMessage(message, `\`\`\`ansi\n${out.split('\n').splice(1).join('\n')}\`\`\``)
            }, discordinterval)


            const tasksss = new Listr(ltasks)
            const context = tasksss.run().catch((e) => {
                // console.log(e)
            })
            context.then((res) => {
                resolve(res);
                updateMessage(message, `\`\`\`ansi\n${out.split('\n').splice(1).join('\n')}\`\`\``)
                out = ""
                clearInterval(interval);
            })
            
        });
    });
}

module.exports = {
    runTask,
    hook
}
