import { JSDOM, ResourceLoader, VirtualConsole, type BaseOptions } from "jsdom"
import type {
  EnvironmentContext,
  JestEnvironment,
  JestEnvironmentConfig,
} from "@jest/environment"
import type { Config, Global } from "@jest/types"
import { ModuleMocker } from "jest-mock"
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

export default class URLEnvironment implements JestEnvironment<number> {
  global: Win
  fakeTimers = null
  fakeTimersModern = null
  moduleMocker: ModuleMocker
  projectConfig: Config.ProjectConfig
  dom: JSDOM = new JSDOM(undefined, { runScripts: "dangerously" })

  constructor(
    config: JestEnvironmentConfig,
    private context: EnvironmentContext,
  ) {
    this.projectConfig = config.projectConfig
    this.global = this.dom.window.document as unknown as Win
    this.moduleMocker = new ModuleMocker(global)
  }

  async setup() {
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

    // for "universal" code (code should use `globalThis`)
    global.global = global as any

    installCommonGlobals(global as any, this.projectConfig.globals)
  }

  async teardown() {
    if (this.global) {
      this.global.close()

      // Dispose "document" to prevent "load" event from triggering.

      // Note that this.global.close() will trigger the CustomElement::disconnectedCallback
      // Do not reset the document before CustomElement disconnectedCallback function has finished running,
      // document should be accessible within disconnectedCallback.
      Object.defineProperty(this.global, "document", { value: null })
    }
    // @ts-expect-error: this.global not allowed to be `null`
    this.global = null
  }

  exportConditions() {
    return ["browser"]
  }

  getVmContext() {
    if (this.dom) {
      return this.dom.getInternalVMContext()
    }
    return null
  }
}
