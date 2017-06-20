const dashdash = require("dashdash")
const path = require("path")
const MeshbluConnectorRunner = require("meshblu-connector-runner/dist/runner.js")
const MeshbluHttp = require("meshblu-http")
const dotenv = require("dotenv")
const dotenvExpand = require("dotenv-expand")
const fs = require("fs")
const chalk = require("chalk")

const CLI_OPTIONS = [
  {
    name: "version",
    type: "bool",
    help: "Print connector version and exit.",
  },
  {
    names: ["help", "h"],
    type: "bool",
    help: "Print this help and exit.",
  },
  {
    names: ["uuid", "u"],
    type: "string",
    env: "MESHBLU_UUID",
    help: "Meshblu UUID",
    helpArg: "UUID",
  },
  {
    names: ["token", "t"],
    type: "string",
    env: "MESHBLU_TOKEN",
    help: "Meshblu Token",
    helpArg: "TOKEN",
  },
  {
    names: ["domain", "d"],
    type: "string",
    default: "octoblu.com",
    env: "MESHBLU_DOMAIN",
    help: "Meshblu SRV Domain",
    helpArg: "DOMAIN",
  },
  {
    names: ["env-file"],
    type: "string",
    default: path.join(process.cwd(), ".env"),
    env: "MESHBLU_ENV_FILE",
    help: "dotenv file",
    helpArg: "FILE",
  },
]

class MeshbluConnectorCommand {
  constructor(options) {
    if (!options) options = {}
    var { argv, cliOptions, connectorPath } = options
    if (!cliOptions) cliOptions = CLI_OPTIONS
    if (!connectorPath) connectorPath = process.cwd()
    if (!argv) return this.die(new Error("MeshbluConnectorCommand requires options.argv"))
    this.argv = argv
    this.connectorPath = connectorPath
    this.cliOptions = cliOptions
    this.connectorPackageJSON = require(path.join(this.connectorPath, "package.json"))
    this.parser = dashdash.createParser({ options: this.cliOptions })
  }

  parseDotEnv({ envFile }) {
    process.env.MESHBLU_CONNECTOR_CWD = process.cwd()
    if (!fs.existsSync(envFile)) return
    const parsedEnv = dotenv.config({ path: envFile })
    dotenvExpand(parsedEnv)
    return
  }

  parseArgv({ argv }) {
    try {
      var opts = this.parser.parse(argv)
    } catch (e) {
      return {}
    }
    if (opts.help) {
      console.log(`usage: meshblu-connector [OPTIONS]\noptions:\n${this.parser.help({ includeEnv: true, includeDefault: true })}`)
      process.exit(0)
    }

    if (opts.version) {
      console.log(this.connectorPackageJSON.version)
      process.exit(0)
    }

    return opts
  }

  run() {
    const options = this.parseArgv({ options: this.cliOptions, argv: this.argv })
    const { uuid, token, env_file } = options
    let errors = []
    this.parseDotEnv({ envFile: env_file })

    if (!uuid) errors.push(new Error("MeshbluConnectorCLI requires --uuid or MESHBLU_UUID"))
    if (!token) errors.push(new Error("MeshbluConnectorCLI requires --token or MESHBLU_TOKEN"))
    if (errors.length) {
      console.log(`usage: meshblu-connector-cli [OPTIONS]\noptions:\n${this.parser.help({ includeEnv: true, includeDefault: true })}`)
      errors.forEach(error => {
        console.error(chalk.red(error.message))
      })
      process.exit(1)
    }

    this.startConnectorRunner({ options })
  }

  startConnectorRunner({ options }) {
    const { uuid, token, domain } = options
    const meshbluConfig = { uuid, token, domain, resolveSrv: true }
    const connectorPath = this.connectorPath
    const logger = {
      trace: console.info,
      debug: console.info,
      info: console.log,
      warn: console.log,
      error: console.error,
      fatal: console.error,
    }
    this.verifyMeshbluDevice({ meshbluConfig }, error => {
      if (error) return this.die(error)
      this.runner = new MeshbluConnectorRunner({ meshbluConfig, connectorPath, logger })
      this.runner.run()
    })
  }

  verifyMeshbluDevice({ meshbluConfig }, callback) {
    const meshbluHttp = new MeshbluHttp(meshbluConfig)
    meshbluHttp.whoami(callback)
  }

  die(error) {
    console.error("Meshblu Connector Command: error: %s", error.message)
    process.exit(1)
  }
}

module.exports.MeshbluConnectorCommand = MeshbluConnectorCommand
