import schedule from 'node-schedule'
import Q from 'q'

function startCron (jobName, _rule, _errorRule, _operation, _args = [], verbose = true) {
  if (!Array.isArray(_args)) {
    _args = [_args]
  }
  console.info(`Cron ${jobName} ready!`)
  console.info('Rule:', JSON.stringify(_rule, null, 2))
  console.info('Error Rule:', JSON.stringify(_errorRule, null, 2))
  let rule = { ...new schedule.RecurrenceRule(), ..._rule }
  
  schedule.scheduleJob(rule, async function () {
    const res = await Q.fapply(_operation, _args)
    const { ok, message, results } = res
    if (ok) {
      verbose && console.log(`Cron ${jobName} response:`, JSON.stringify(results, null, 2))
      rule = { ...new schedule.RecurrenceRule(), ..._rule }
      this.reschedule(rule)
    } else {
      console.error(`Cron ${jobName} error:`, message)
      rule = { ...new schedule.RecurrenceRule(), ..._errorRule }
      this.reschedule(rule)
    }
    const nextInv = this.nextInvocation()._date
    verbose && console.log(`Cron ${jobName} next invocation:`, nextInv.toString())
  })
}

export default {
  startCron,
}
