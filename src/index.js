import fs from 'fs'
import moment from 'moment'
import readdir from 'recursive-readdir'
import Q from 'q'
import path from 'path'
import chalk from 'chalk'

const promises = []

const destDir = 'e:\\Dati'
const fromBaseDir = 'c:\\Users\\Asten\\Documents'
promises.push(() => main('INVENTARI', 6, false))
promises.push(() => main('TXT\\SUMITOMO', 12, false))

async function main (secFolder, limitMonths, prod = true) {
  let count = 0
  const baseDir = path.join(fromBaseDir, secFolder)
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
    return { ok: false, message: err.message, err, taskName: secFolder }
  }
}

async function execAll () {
  const response = []
  for (let exec of promises) {
    response.push(await exec())
  }
  console.log()
  return { response }
}

execAll().then(res => console.log(JSON.stringify(res, null, 2)))
