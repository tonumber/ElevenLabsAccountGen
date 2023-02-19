const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const axios = require('axios')
const { executablePath } = require('puppeteer')
const { runTask, hook } = require('./task.js')

puppeteer.use(StealthPlugin())


const generateTemp = () => {
    return new Promise((resolve, reject) => {
        axios.get("https://api.tempmail.lol/generate").then((res) => {
            resolve(res.data)
            console.log(res.data)
        }).catch((e) => {
            console.error(e)
            reject(e)
        })
    })
}

const getMail = (token) => {
    return new Promise((resolve, reject) => {
        axios.get("https://api.tempmail.lol/auth/" + token).then((res) => {
            resolve(res.data)
        }).catch((e) => {
            console.error(e)
            reject(e)
        })
    })
}

const getVerifyCode = (mail) => {
    return new Promise((resolve, reject) => {
        const email1 = mail['email'][0]
        const link = getVerifyUrl(email1['body'])
        resolve(link)
    })
}


function getVerifyUrl(string) {
    verifyurl = string.split("https://xi-labs")[1].split("&lang=en")[0]
    verifyurl = "https://xi-labs" + verifyurl + "&lang=en"

    return verifyurl
}
function logAccount({ email, password }) {
    hook.send(`\`\`\`ini\n[Account]\nemail = ${email}\npassword = ${password}\n\`\`\``)
    require('fs').appendFileSync('accounts.txt', `${email}:${password}\n`)
}

const tasks = [
    {
        title: 'Initialize',
        task: async () => {
            await new Promise((resolve, reject) => {
                setTimeout(resolve, 1)
            })
        }
    },
    {
        title: 'Generate TempMail',
        task: async (ctx, task) => {
            ctx.mail = await generateTemp()
            return ctx.mail
        }
    },
    {
        title: 'Open Browser',
        task: async (ctx, task) => {
            ctx.browser = await puppeteer.launch({
                headless: false,
                executablePath: executablePath()
            })
            await ctx.browser.userAgent()
        }
    },
    {
        title: 'Open Page',
        task: async (ctx, task) => {
            ctx.page = await ctx.browser.newPage();
            ctx.page.goto('https://beta.elevenlabs.io/sign-up')
            await ctx.page.waitForSelector('input[name="email"]')
        }
    },
    {
        title: 'Fill Form',
        task: async (ctx, task) => {
            await ctx.page.waitForSelector('input[name="email"]')
            let email = ctx.mail.address;
            let password = "FiziWuzHere@" + Math.floor(Math.random() * 100000000000000000)
            ctx.account = {
                email: email,
                password: password
            }
            await ctx.page.type('input[name="email"]', email)
            await ctx.page.type('input[name="password"]', password)
            await ctx.page.click('input[name="terms"]')
            await ctx.page.click('button[type="submit"]');
            await ctx.page.waitForSelector('div[class="flex-1 text-sm font-medium text-white w-full pr-8 leading-tight"]')
            return ctx.page
        }
    },
    {
        title: 'Get Verify Code',
        task: async (ctx, task) => {
            await new Promise((res,rej)=>{
                setTimeout(async () => {
                    ctx.verifycode = await getVerifyCode(await getMail(ctx.mail.token))
                    res()
                }, 7000)
            })
        }
    },
    {
        title: 'Verify',
        task: async (ctx, task) => {
            await ctx.page.goto(ctx.verifycode)
            await ctx.page.waitForSelector("#actionElement > div > div.firebaseui-card-header > h1")
            const check = await ctx.page.evaluate(() => {
                return document.querySelector("#actionElement > div > div.firebaseui-card-header > h1").innerText
            })
            if (check == "Try verifying your email again") {
                return ctx.status = "Failed"
            }
            return true
        }
    },
    {
        title: 'Close Browser',
        task: async (ctx, task) => {
            await ctx.browser.close()
            return logAccount(ctx.account)
        }
    }
]

function runLoop() {
    runTask(tasks).then(() => {
        runLoop()
    })
}

runLoop()