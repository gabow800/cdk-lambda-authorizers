import { App, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, MethodLoggingLevel, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { CfnPermission, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  private restApi: RestApi;
  private hellowFunction: NodejsFunction;

  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    this.restApi = new RestApi(this, `${id}-api`, {
      deployOptions: {
        stageName: 'default',
        metricsEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
      },
    });

    this.hellowFunction = new NodejsFunction(this, `${id}-lambda-hellow`, {
      functionName: 'lambda-hellow',
      entry: 'src/app/hellow/handler.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_14_X,
      memorySize: 512,
      timeout: Duration.seconds(10),
    });

    this.restApi.root
      .addResource('hellow')
      .addMethod('GET', new LambdaIntegration(this.hellowFunction, {}));

    this.restApi.node.addDependency(
      new CfnPermission(this, `${id}-invoke-permission-hellow`, {
        action: 'lambda:InvokeFunction',
        functionName: this.hellowFunction.functionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: `arn:aws:execute-api:${Stack.of(this).region}:${Stack.of(this).account}:*`,
      }),
    );
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'cdk-lambda-authorizers-dev', { env: devEnv });
// new MyStack(app, 'cdk-lambda-authorizers-prod', { env: prodEnv });

app.synth();