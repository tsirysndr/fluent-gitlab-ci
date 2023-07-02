import {
  Action,
  DeploymentTier,
  Environment as EnvironmentSpec,
} from "./gitlabci_spec.ts";

class Environment {
  private environment: EnvironmentSpec;

  into(): EnvironmentSpec {
    return this.environment;
  }

  constructor(name: string, url?: string) {
    this.environment = {
      name,
      url,
    };
  }

  url(url: string): Environment {
    this.environment.url = url;
    return this;
  }

  onStop(value: string): Environment {
    this.environment.on_stop = value;
    return this;
  }

  action(value: Action): Environment {
    this.environment.action = value;
    return this;
  }

  auto_stop_in(value: string): Environment {
    this.environment.auto_stop_in = value;
    return this;
  }

  kubernetes(namespace: string): Environment {
    this.environment.kubernetes = {
      namespace,
    };
    return this;
  }

  deployment_tier(value: DeploymentTier): Environment {
    this.environment.deployment_tier = value;
    return this;
  }
}

export default Environment;
