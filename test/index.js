'use strict';

const test = require('tape')
    , proxyquire =  require('proxyquire')
    , spies = []
    , Machine = proxyquire('../', { child_process: createMock(spies) })

test('name defaults to DOCKER_MACHINE_NAME or "default"', function (t) {
  t.plan(6)

  process.env.DOCKER_MACHINE_NAME = 'beep'

  t.is(new Machine().name, 'beep', 'DOCKER_MACHINE_NAME')
  t.is(new Machine('agent').name, 'agent', 'as string')
  t.is(new Machine({ name: 'agent' }).name, 'agent', 'as option')

  process.env.DOCKER_MACHINE_NAME = ''

  t.is(new Machine().name, 'default', 'default')
  t.is(new Machine('agent').name, 'agent', 'as string')
  t.is(new Machine({ name: 'agent' }).name, 'agent', 'as option')
})

test('cwd defaults to DOCKER_TOOLBOX_INSTALL_PATH or cwd', function (t) {
  t.plan(6)

  process.env.DOCKER_TOOLBOX_INSTALL_PATH = '/docker'

  const s1 = spy({ result: 'fake1' })
  const s2 = spy({ result: 'fake2' })

  Machine.command('anything1', (err, res) => {
    t.is(res, 'fake1')
    t.same(s1.args, ['anything1'])
    t.is(s1.opts.cwd, '/docker', 'DOCKER_TOOLBOX_INSTALL_PATH')
  })

  process.env.DOCKER_TOOLBOX_INSTALL_PATH = ''

  Machine.command('anything2', (err, res) => {
    t.is(res, 'fake2')
    t.same(s2.args, ['anything2'])
    t.is(s2.opts.cwd, '.', 'cwd')
  })
})

test('status', function (t) {
  t.plan(6)

  const s1 = spy({ result: ' running\n' })
  const s2 = spy({ result: 'Stopped' })

  Machine.status('beep', (err, status) => {
    t.ifError(err, 'no status error')
    t.is(status, 'running', 'trimmed')
    t.same(s1.args, ['status', 'beep'])
  })

  new Machine().status((err, status) => {
    t.ifError(err, 'no status error')
    t.is(status, 'stopped', 'lowercased')
    t.same(s2.args, ['status', 'default'])
  })
})

test('isRunning', function (t) {
  t.plan(6)

  const s1 = spy({ result: ' running\n' })
  const s2 = spy({ result: 'Stopped' })

  Machine.isRunning('beep', (err, running) => {
    t.ifError(err, 'no isRunning error')
    t.is(running, true, 'running')
    t.same(s1.args, ['status', 'beep'])
  })

  new Machine().isRunning((err, running) => {
    t.ifError(err, 'no isRunning error')
    t.is(running, false, 'not running')
    t.same(s2.args, ['status', 'default'])
  })
})

function spy(state) {
  spies.push(state)
  return state
}

function createMock(spies) {
  return {
    execFile(cmd, args, opts, done) {
      const state = spies.shift()

      state.cmd = cmd
      state.args = args
      state.opts = opts

      process.nextTick(done, null, state.result)
    }
  }
}
