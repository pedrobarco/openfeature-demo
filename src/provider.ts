import { EvaluationContext, InMemoryProvider } from "@openfeature/server-sdk";
import { FeatureFlag } from "./flags";

export type Flag = NonNullable<
  ConstructorParameters<typeof InMemoryProvider>[0]
>[string];

export type FlagConfiguration = Record<FeatureFlag, Flag>;

export type FlagDefaults = Partial<Record<FeatureFlag, string>>;

export class MyProvider extends InMemoryProvider {
  constructor(
    config: FlagConfiguration,
    defaults: Partial<Record<FeatureFlag, string>>,
  ) {
    Object.keys(config).forEach((k) => {
      const flagName = k as FeatureFlag;

      if (defaults[flagName] !== undefined) {
        config[flagName].defaultVariant = defaults[flagName];
      }

      if (!config[flagName].contextEvaluator) {
        config[flagName].contextEvaluator = MyProvider.evaluateContextFn(
          flagName,
          config[flagName],
        );
      }
    });

    super(config);
  }

  private static evaluateContextFn(
    flagName: string,
    flag: Flag,
  ): (context: EvaluationContext) => string {
    return (context: EvaluationContext) => {
      let flags = context["x-feature-flags"];
      if (!(Array.isArray(flags) || typeof flags === "string")) {
        return flag.defaultVariant;
      }

      if (typeof flags === "string") {
        flags = flags.includes(",")
          ? flags.split(",").map((f) => f.trim())
          : [flags.trim()];
      }

      const value = (flags as string[]).find((f) =>
        f.startsWith(`${flagName}:`),
      );
      if (!value) {
        return flag.defaultVariant;
      }

      const parts = value.split(":");
      if (parts.length !== 2) {
        return flag.defaultVariant;
      }

      const variant = parts[1];
      if (!flag.variants.hasOwnProperty(variant)) {
        return flag.defaultVariant;
      }

      return variant;
    };
  }
}
