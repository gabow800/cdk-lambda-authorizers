
export const handler = async (event: any, _context: any, _callback: any) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const queryStringParameters = event.queryStringParameters;

  if (queryStringParameters.token === 'xxx') {
    return generatePolicy('me', 'Allow', event.methodArn);
  } else {
    return 'Unauthorized';
  }
};

const generatePolicy = (principalId: any, effect: any, resource: any) => {
  const authResponse = {} as any;
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {} as any;
    policyDocument.Version = '2012-10-17'; // default version
    policyDocument.Statement = [];
    const statementOne = {} as any;
    statementOne.Action = 'execute-api:Invoke'; // default action
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  return authResponse;
};