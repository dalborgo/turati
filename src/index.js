import fs from 'fs'
import moment from 'moment'
import readdir from 'recursive-readdir'
import Q from 'q'
import path from 'path'
import chalk from 'chalk'

const destDir = 'e:\\Dati'

async function main (baseDir, limitMonths, prod = true) {
  const splitFolder = baseDir.split('\\')
  const secFolder = splitFolder[splitFolder.length - 1]
  console.info('Folder to copy:', chalk.blue(secFolder))
  console.log()
  try {
    const files = await readdir(baseDir)
    for await (const file of files) {
      const stat = await Q.ninvoke(fs, 'stat', file)
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
          !dirExists && await Q.nfcall(fs.mkdir, destRest)
          await Q.ninvoke(fs, 'copyFile', file, dest)
          if (prod) {
            try {
              await Q.ninvoke(fs, 'unlink', file)
            } catch (err) {
              console.warn(err.message)
              console.log()
              continue
            }
          }
          console.log(chalk.green('OK'))
        }
        console.log()
      }
    }
  } catch (err) {
    console.error(err.message)
    return { ok: false, message: err.message, err }
  }
}

const promises = []

promises.push(() => main('c:\\tmp', 1)) //\\10.0.0.17\Asten\MARCO\prova
//promises.push(() => main('\\\\10.0.0.17\\Asten\\MARCO\\prova2', 2))

async function execAll () {
  for (let exec of promises) {
    await exec()
  }
}

execAll().then()
