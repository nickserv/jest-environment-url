import { JSDOM, ResourceLoader, VirtualConsole, type BaseOptions } from "jsdom"
import JSDOMEnvironment from "jest-environment-jsdom"
import type {
  EnvironmentContext,
  JestEnvironmentConfig,
} from "@jest/environment"
import type { Config, Global } from "@jest/types"
import { installCommonGlobals } from "jest-util"

// The `Window` interface does not have an `Error.stackTraceLimit` property, but
// `JSDOMEnvironment` assumes it is there.
type Win = Window &
  Global.Global & {
    Error: {
      stackTraceLimit: number
    }
  }

export interface TestEnvironmentOptions extends BaseOptions {
  url?: string
}

export default class URLEnvironment extends JSDOMEnvironment {
  projectConfig: Config.ProjectConfig
  context: EnvironmentContext

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context)
    this.projectConfig = config.projectConfig
    this.context = context
  }

  override async setup() {
    const virtualConsole = new VirtualConsole()
    virtualConsole.sendTo(this.context.console, { omitJSDOMErrors: true })
    virtualConsole.on("jsdomError", (error) => {
      this.context.console.error(error)
    })

    const { url, ...options }: TestEnvironmentOptions =
      this.projectConfig.testEnvironmentOptions

    if (!url) {
      throw new Error("URL option is required")
    }

    this.dom = await JSDOM.fromURL(url, {
      pretendToBeVisual: true,
      resources:
        typeof this.projectConfig.testEnvironmentOptions.userAgent === "string"
          ? new ResourceLoader({
              userAgent: this.projectConfig.testEnvironmentOptions.userAgent,
            })
          : undefined,
      runScripts: "dangerously",
      virtualConsole,
      ...options,
    })

    const global = (this.global = this.dom.window.document
      .defaultView as unknown as Win)

    if (!global) {
      throw new Error("JSDOM did not return a Window object")
    }

    // for "universal" code (code should use `globalThis`)
    global.global = global as any

    installCommonGlobals(global as any, this.projectConfig.globals)
  }
}
