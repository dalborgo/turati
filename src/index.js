import fs from 'fs'
import moment from 'moment'
import readdir from 'recursive-readdir'
import Q from 'q'
import path from 'path'
import chalk from 'chalk'
import cron from './cron'

const isProd = () => process.env.NODE_ENV === 'production'

const promises = []

const destDir = 'e:\\Dati'
promises.push(() => main('c:\\Users\\Asten\\Documents', 'INVENTARI', 6, false))
promises.push(() => main('c:\\Users\\Asten\\Documents', 'TXT\\SUMITOMO', 12, false))

async function main (fromBaseDir, secFolder, limitMonths, prod = true) {
  let count = 0
  const baseDir = path.join(fromBaseDir, secFolder)
  console.log()
  console.info('Folder to copy:', chalk.blue(secFolder))
  console.log()
  try {
    const files = await readdir(baseDir)
    for await (const file of files) {
      const stat = await Q.nfcall(fs.stat, file)
      const fromTime = new Date(stat.mtime)
      const date = moment(fromTime)
      const now = moment()
      const duration = moment.duration(now.diff(date))
      const months = Math.round(duration.asMonths())
      const basename = path.basename(file)
      const rest = path.dirname(file).replace(baseDir, '')
      const destRest = path.join(destDir, secFolder, rest)
      const dest = path.join(destRest, basename)
      if (months > limitMonths) {
        console.log('from:', file)
        console.log('fromTime:', moment(fromTime).format('YYYY-MM-DD'))
        console.log('months:', months)
        console.log('now:', moment(now).format('YYYY-MM-DD'))
        console.log('dest:', dest)
        if (!fs.existsSync(dest)) {
          const dirExists = fs.existsSync(destRest)
          try {
            !dirExists && await Q.nfcall(fs.mkdir, destRest, { recursive: true })
            await Q.nfcall(fs.copyFile, file, dest)
          } catch (err) {
            console.warn(chalk.yellow(err.message))
            continue
          }
          if (prod) {
            try {
              await Q.nfcall(fs.unlink, file)
            } catch (err) {
              console.warn(chalk.yellow(err.message))
              console.log()
              continue
            }
          }
          count++
          console.log(chalk.green('OK'))
        } else {
          console.log(chalk.green('SKIPPED'))
        }
        console.log()
      }
    }
    return { ok: true, taskName: secFolder, count }
  } catch (err) {
    console.error(chalk.red(err.message))
    console.log()
    return {
      count,
      err,
      message: err.message,
      ok: false,
      taskName: secFolder,
    }
  }
}

async function execAll () {
  const results = []
  for (let exec of promises) {
    results.push(await exec())
  }
  return { ok: true, results }
}

if (isProd()) {
  const when = { dayOfWeek: 6, hour: 3, minute: 0 }
  cron.startCron('execAll', when, when, execAll)
} else {
  execAll().then(res => console.log(JSON.stringify(res, null, 2)))
}
