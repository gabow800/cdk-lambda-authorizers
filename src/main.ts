import { App, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { AuthorizationType, IdentitySource, LambdaIntegration, MethodLoggingLevel, RequestAuthorizer, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { CfnPermission, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  public restApi: RestApi;
  public hellowFunction: NodejsFunction;
  public authorizerFunction: NodejsFunction;
  public authorizer: RequestAuthorizer;

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

    this.authorizerFunction = new NodejsFunction(this, `${id}-lambda-authorizer`, {
      functionName: `${id}-lambda-authorizer`,
      entry: 'src/app/authorizer/handler.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_14_X,
      memorySize: 512,
      timeout: Duration.seconds(10),
    });

    this.authorizer = new RequestAuthorizer(this, `${id}-authorizer`, {
      handler: this.authorizerFunction,
      identitySources: [IdentitySource.queryString('token')],
    });

    this.hellowFunction = new NodejsFunction(this, `${id}-lambda-hellow`, {
      functionName: `${id}-lambda-hellow`,
      entry: 'src/app/hellow/handler.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_14_X,
      memorySize: 512,
      timeout: Duration.seconds(10),
    });

    this.restApi.root
      .addResource('hellow')
      .addMethod('GET', new LambdaIntegration(this.hellowFunction, {}), {
        authorizationType: AuthorizationType.CUSTOM,
        authorizer: this.authorizer,
      });

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